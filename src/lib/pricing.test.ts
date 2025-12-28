
import { calculatePrice } from './pricing';
import { PricingRule, CalendarOverride, Discount } from '@/types';

// Simple Test Runner
async function runTests() {
    console.log("🚀 Starting Pricing Engine Tests...\n");
    let passed = 0;
    let failed = 0;

    function assert(condition: boolean, message: string) {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${message}`);
            failed++;
        }
    }

    // Mock Data
    const hallId = "hall-123";
    const basePrice = 1000;
    const targetDate = new Date("2025-12-25"); // Thursday

    // Mock DB State
    let mockOverrides: CalendarOverride[] = [];
    let mockRules: PricingRule[] = [];
    let mockDiscounts: Discount[] = [];

    // Mock Client
    const mockSupabase = {
        from: (table: string) => ({
            select: (cols: string) => ({
                eq: (col: string, val: string) => {
                    const chain = {
                        single: async () => {
                            if (table === 'halls') return { data: { base_price: basePrice }, error: null };
                            return { data: null, error: null };
                        },
                        maybeSingle: async () => {
                            if (table === 'calendar_overrides') {
                                const override = mockOverrides.find(o => o.date === val);
                                return { data: override || null, error: null };
                            }
                            return { data: null, error: null };
                        },
                        order: async () => {
                            if (table === 'pricing_rules') return { data: mockRules, error: null };
                            return { data: [], error: null };
                        },
                        eq: (col2: string, val2: any) => {
                            // Handle second eq
                            return {
                                maybeSingle: async () => {
                                    if (table === 'calendar_overrides') {
                                        // We need to check both conditions effectively, but here we just check date
                                        // In a real mock we'd track the query state.
                                        // For this simple test, we assume if we got here, we are checking overrides
                                        const override = mockOverrides.find(o => o.date === val2); // val2 is dateStr
                                        return { data: override || null, error: null };
                                    }
                                    return { data: null, error: null };
                                },
                                then: (resolve: any) => {
                                    if (table === 'discounts') return resolve({ data: mockDiscounts, error: null });
                                    return resolve({ data: [], error: null });
                                }
                            }
                        }
                    };
                    return chain;
                }
            })
        })
    };

    // TEST 1: Base Price Only
    mockOverrides = [];
    mockRules = [];
    mockDiscounts = [];
    let result = await calculatePrice(hallId, targetDate, mockSupabase);
    assert(result.finalPrice === 1000, `Base Price should be 1000, got ${result.finalPrice}`);

    // TEST 2: Day of Week Rule (Level 1)
    // Thursday is index 4
    mockRules = [{
        id: 'r1', hall_id: hallId, name: 'Thursday Special', rule_level: 1,
        start_date: null, end_date: null, days_of_week: [4],
        adjustment_type: 'fixed', adjustment_value: 1200
    }];
    result = await calculatePrice(hallId, targetDate, mockSupabase);
    assert(result.finalPrice === 1200, `Level 1 Rule should apply (1200), got ${result.finalPrice}`);

    // TEST 3: Season Rule (Level 2) overrides Level 1
    mockRules = [
        {
            id: 'r2', hall_id: hallId, name: 'Winter Season', rule_level: 2,
            start_date: '2025-12-01', end_date: '2025-12-31', days_of_week: [],
            adjustment_type: 'percent', adjustment_value: 20 // +20% = 1200
        },
        ...mockRules // Include Level 1 rule
    ];
    // Note: In my implementation, I sort by rule_level DESC. So Level 2 comes before Level 1.
    // Logic: 1000 + 20% = 1200.
    // Let's make Level 1 different to be sure.
    mockRules[1].adjustment_value = 1500; // Level 1 is 1500
    // Level 2 is +20% of 1000 = 1200.
    // Expected: 1200.
    result = await calculatePrice(hallId, targetDate, mockSupabase);
    assert(result.finalPrice === 1200, `Level 2 Rule should override Level 1 (1200), got ${result.finalPrice}`);

    // TEST 4: Special Holiday (Level 3) overrides Level 2
    mockRules = [
        {
            id: 'r3', hall_id: hallId, name: 'Christmas', rule_level: 3,
            start_date: '2025-12-25', end_date: '2025-12-25', days_of_week: [],
            adjustment_type: 'flat', adjustment_value: 500 // 1000 + 500 = 1500
        },
        ...mockRules
    ];
    result = await calculatePrice(hallId, targetDate, mockSupabase);
    assert(result.finalPrice === 1500, `Level 3 Rule should override Level 2 (1500), got ${result.finalPrice}`);

    // TEST 5: Manual Override takes precedence
    mockOverrides = [{
        id: 'o1', hall_id: hallId, date: '2025-12-25', price: 5000
    }];
    result = await calculatePrice(hallId, targetDate, mockSupabase);
    assert(result.finalPrice === 5000, `Manual Override should take top priority (5000), got ${result.finalPrice}`);

    // TEST 6: Discounts
    // Reset to Base Price for clarity
    mockOverrides = [];
    mockRules = [];
    // Base 1000.
    // Discount: 10% off if booked > 30 days in advance.
    // targetDate is 2025-12-25. Current date is mocked as... wait, differenceInDays uses new Date().
    // I need to ensure targetDate is far enough.
    // 2025 is far future.
    mockDiscounts = [{
        id: 'd1', hall_id: hallId, name: 'Early Bird', type: 'percent', value: 10,
        min_advance_booking_days: 20, active: true
    }];
    result = await calculatePrice(hallId, targetDate, mockSupabase);
    // 1000 - 10% = 900.
    assert(result.finalPrice === 900, `Discount should apply (900), got ${result.finalPrice}`);

    console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed.`);
    if (failed > 0) process.exit(1);
}

runTests().catch(console.error);
