import { createClient } from "@/utils/supabase/client";
import { CalendarDayStatus, DayDisplayState, Hall, HallService, PricingTemplate, PricingRule, CalendarOverride, Discount } from "@/types";
import { addDays, format, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { calculatePriceLogic } from "./pricing";

export async function getHalls(): Promise<Hall[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("halls")
        .select("*");

    if (error) {
        console.error("Error fetching halls:", error);
        return [];
    }
    return data as Hall[];
}

export async function getHallBySlug(slug: string): Promise<Hall | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("halls")
        .select("*")
        .eq("slug", slug)
        .single();

    if (error) {
        console.error("Error fetching hall:", error.message, error.code, error.details, error.hint);
        return null;
    }
    return data;
}

export async function getHallServices(hallId: string): Promise<HallService[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from("hall_services")
        .select("*, service:services_catalog(*)")
        .eq("hall_id", hallId);

    if (error) {
        console.error("Error fetching services:", error);
        return [];
    }
    return data as HallService[];
}

export async function getCalendarData(
    hallId: string,
    startDate: Date,
    endDate: Date
): Promise<Record<string, DayDisplayState>> {
    const supabase = createClient();
    const startStr = format(startDate, "yyyy-MM-dd");
    const endStr = format(endDate, "yyyy-MM-dd");

    // 1. Fetch ALL Data in Parallel
    console.log("getCalendarData: Starting parallel fetch...");
    const [hallRes, rulesRes, overridesRes, discountsRes, calendarRes, bookingsRes] = await Promise.all([
        supabase.from("halls").select("base_price").eq("id", hallId).single().then(res => { console.log("Fetched hall"); return res; }),
        supabase.from("pricing_rules").select("*").eq("hall_id", hallId).order("rule_level", { ascending: false }).then(res => { console.log("Fetched rules"); return res; }),
        supabase.from("calendar_overrides").select("*").eq("hall_id", hallId).gte("date", startStr).lte("date", endStr).then(res => { console.log("Fetched overrides"); return res; }),
        supabase.from("discounts").select("*").eq("hall_id", hallId).eq("active", true).then(res => { console.log("Fetched discounts"); return res; }),
        supabase.from("calendar_days").select("*").eq("hall_id", hallId).gte("date", startStr).lte("date", endStr).then(res => { console.log("Fetched calendar_days"); return res; }),
        supabase.from("bookings").select("*").eq("hall_id", hallId).gte("event_date", startStr).lte("event_date", endStr).neq("status", "cancelled").then(res => { console.log("Fetched bookings"); return res; })
    ]);
    console.log("getCalendarData: Parallel fetch complete");

    if (hallRes.error) console.error("Error fetching hall:", hallRes.error);
    if (rulesRes.error) console.error("Error fetching rules:", rulesRes.error);
    if (overridesRes.error) console.error("Error fetching overrides:", overridesRes.error);
    if (discountsRes.error) console.error("Error fetching discounts:", discountsRes.error);
    if (calendarRes.error) console.error("Error fetching calendar:", calendarRes.error);
    if (bookingsRes.error) console.error("Error fetching bookings:", bookingsRes.error);

    const basePrice = hallRes.data?.base_price || 0;
    const rules = (rulesRes.data || []) as any[];
    const overrides = (overridesRes.data || []) as any[];
    const discounts = (discountsRes.data || []) as any[];
    const calendarDays = calendarRes.data || [];
    const bookings = bookingsRes.data || [];

    // 2. Calculate Prices for Each Day
    const days: Record<string, DayDisplayState> = {};
    let current = startDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    while (current <= endDate) {
        const dateKey = format(current, "yyyy-MM-dd");

        const priceBreakdown = calculatePriceLogic(
            current,
            basePrice,
            rules as PricingRule[],
            overrides as CalendarOverride[],
            discounts as Discount[]
        );

        const dayRecord = calendarDays.find((d) => d.date === dateKey);
        const booking = bookings.find((b) => b.event_date === dateKey);

        // Determine Status
        // Priority: Booking > Maintenance (CalendarDay) > Available
        let status: CalendarDayStatus = "available";

        if (booking) {
            status = "booked";
        } else if (dayRecord?.status === "maintenance") {
            status = "maintenance";
        }

        // Determine Price
        // If booked/maintenance, price is hidden (null)
        let price: number | null = priceBreakdown.finalPrice;

        // Check for manual override in calendar_days
        if (dayRecord?.manual_price !== null && dayRecord?.manual_price !== undefined) {
            price = dayRecord.manual_price;
        }

        if (status !== "available") {
            price = null;
        }

        days[dateKey] = {
            date: dateKey,
            status,
            price,
            isPast: current < today,
        };

        current = addDays(current, 1);
    }

    return days;
}

export async function updateDayStatus(
    hallId: string,
    date: string,
    status: CalendarDayStatus,
    manualPrice?: number
) {
    const supabase = createClient();

    // Upsert logic
    const { error } = await supabase
        .from("calendar_days")
        .upsert(
            {
                hall_id: hallId,
                date,
                status,
                manual_price: manualPrice,
            },
            { onConflict: "hall_id,date" }
        );

    if (error) throw error;
}

export async function getMonthlyRevenue(supabase: any): Promise<number> {
    const today = new Date();
    const startMonth = format(startOfMonth(today), "yyyy-MM-dd");
    const endMonth = format(endOfMonth(today), "yyyy-MM-dd");

    const { data: bookings } = await supabase
        .from("bookings")
        .select("total_price")
        .neq("status", "cancelled")
        .gte("event_date", startMonth)
        .lte("event_date", endMonth);

    if (!bookings) return 0;

    return bookings.reduce((sum: number, booking: any) => sum + Number(booking.total_price), 0);
}
