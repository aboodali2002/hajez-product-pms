import { createClient } from "@/utils/supabase/client";
import { CalendarDayStatus, DayDisplayState, Hall, HallService, PricingTemplate } from "@/types";
import { addDays, format, isSameDay } from "date-fns";

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

    // 1. Fetch Pricing Templates
    const { data: templates, error: templatesError } = await supabase
        .from("pricing_templates")
        .select("*")
        .eq("hall_id", hallId);

    if (templatesError) console.error("Error fetching templates:", templatesError);

    // 2. Fetch Calendar Overrides/Bookings
    const { data: calendarDays, error: calendarError } = await supabase
        .from("calendar_days")
        .select("*")
        .eq("hall_id", hallId)
        .gte("date", startStr)
        .lte("date", endStr);

    if (calendarError) console.error("Error fetching calendar:", calendarError);

    // 3. Merge Data
    const days: Record<string, DayDisplayState> = {};
    const templateMap = new Map<number, number>(); // day_of_week -> price
    templates?.forEach((t: PricingTemplate) => templateMap.set(t.day_of_week, t.price));

    let current = startDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    while (current <= endDate) {
        const dateKey = format(current, "yyyy-MM-dd");
        const dayOfWeek = current.getDay();

        // Find specific calendar record
        const dayRecord = calendarDays?.find((d) => d.date === dateKey);

        let status: CalendarDayStatus = "available";
        let price: number | null = templateMap.get(dayOfWeek) || 5000; // Default fallback

        if (dayRecord) {
            status = dayRecord.status as CalendarDayStatus;
            if (dayRecord.manual_price !== null) {
                price = dayRecord.manual_price;
            }
        }

        // If booked/maintenance, price is hidden (null)
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
