import { createClient } from "@/utils/supabase/client";
import { addDays, differenceInDays, getDay, isSameDay, parseISO, startOfDay } from "date-fns";
import { CalendarOverride, Discount, Hall, PricingRule } from "@/types";

type PriceBreakdown = {
    basePrice: number;
    finalPrice: number;
    appliedRule?: PricingRule;
    appliedOverride?: CalendarOverride;
    appliedDiscounts: Discount[];
};

export async function calculatePrice(
    hallId: string,
    targetDate: Date,
    supabaseClient?: any // Typed as any to avoid importing SupabaseClient type issues, or use ReturnType<typeof createClient>
): Promise<PriceBreakdown> {
    const supabase = supabaseClient || createClient();
    const dateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // 1. Fetch all necessary data in parallel
    const [hallRes, overrideRes, rulesRes, discountsRes] = await Promise.all([
        supabase.from("halls").select("base_price").eq("id", hallId).single(),
        supabase.from("calendar_overrides").select("*").eq("hall_id", hallId).eq("date", dateStr).maybeSingle(),
        supabase.from("pricing_rules").select("*").eq("hall_id", hallId).order("rule_level", { ascending: false }),
        supabase.from("discounts").select("*").eq("hall_id", hallId).eq("active", true)
    ]);

    if (hallRes.error) throw new Error(`Failed to fetch hall: ${hallRes.error.message}`);

    return calculatePriceLogic(
        targetDate,
        hallRes.data.base_price || 0,
        (rulesRes.data || []) as PricingRule[],
        overrideRes.data ? [overrideRes.data as CalendarOverride] : [],
        (discountsRes.data || []) as Discount[]
    );
}

export function calculatePriceLogic(
    targetDate: Date,
    basePrice: number,
    rules: PricingRule[],
    overrides: CalendarOverride[],
    discounts: Discount[]
): PriceBreakdown {
    const dateStr = targetDate.toISOString().split('T')[0];
    const dayOfWeek = getDay(targetDate);

    let currentPrice = basePrice;
    let appliedRule: PricingRule | undefined;
    let appliedOverride: CalendarOverride | undefined;
    const appliedDiscounts: Discount[] = [];

    // 1. Manual Override
    const override = overrides.find(o => o.date === dateStr);
    if (override) {
        currentPrice = override.price;
        appliedOverride = override;
    } else {
        // 2. Pricing Rules (Level 3 -> 2 -> 1)
        // Rules should be sorted by rule_level DESC (3, 2, 1) before passing here
        for (const rule of rules) {
            let matches = false;

            // Check Date Range (if applicable)
            if (rule.start_date && rule.end_date) {
                if (dateStr >= rule.start_date && dateStr <= rule.end_date) {
                    matches = true;
                }
            }

            // Check Day of Week (if applicable)
            if (rule.days_of_week && rule.days_of_week.length > 0) {
                const dowMatch = rule.days_of_week.includes(dayOfWeek);

                if (rule.start_date || rule.end_date) {
                    // If it has dates, it must match dates AND DoW
                    matches = matches && dowMatch;
                } else {
                    // If no dates, it just needs to match DoW
                    matches = dowMatch;
                }
            } else if (!rule.start_date && !rule.end_date) {
                // No dates and no DoW? Always matches? Or invalid rule?
                // Assuming catch-all if no criteria, but usually rules have criteria.
                // Let's assume it matches if no criteria are set (unlikely but safe).
                matches = true;
            }

            if (matches) {
                appliedRule = rule;
                // Apply Adjustment
                switch (rule.adjustment_type) {
                    case 'fixed':
                        currentPrice = rule.adjustment_value;
                        break;
                    case 'flat':
                        currentPrice = basePrice + rule.adjustment_value;
                        break;
                    case 'percent':
                        currentPrice = basePrice + (basePrice * (rule.adjustment_value / 100));
                        break;
                }
                break; // Stop at first match (highest priority due to sort)
            }
        }
    }

    // 3. Discount Logic
    const daysInAdvance = differenceInDays(targetDate, startOfDay(new Date()));

    for (const discount of discounts) {
        if (daysInAdvance >= discount.min_advance_booking_days) {
            let discountAmount = 0;

            if (discount.type === 'flat') {
                discountAmount = discount.value;
            } else if (discount.type === 'percent') {
                discountAmount = currentPrice * (discount.value / 100);
            }

            currentPrice -= discountAmount;
            appliedDiscounts.push(discount);
        }
    }

    // Ensure price doesn't go negative
    currentPrice = Math.max(0, currentPrice);

    return {
        basePrice,
        finalPrice: currentPrice,
        appliedRule,
        appliedOverride,
        appliedDiscounts
    };
}
