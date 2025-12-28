/**
 * Safe Data Service Layer
 * 
 * This service ensures that ALL database queries are scoped to a specific company_id.
 * This is critical for application-level security in our multi-tenant system.
 * 
 * RULES:
 * 1. NEVER use direct supabase.from() calls in components/pages
 * 2. ALWAYS use these safe fetchers that require companyId
 * 3. All functions validate companyId is provided
 * 4. Ownership is verified for nested resources (e.g., hall belongs to company)
 */

import { createClient } from '@/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import {
    Hall,
    Booking,
    Client,
    Payment,
    PricingRule,
    CalendarOverride,
    Discount,
    DayDisplayState,
    CalendarDayStatus
} from '@/types';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { calculatePriceLogic } from '@/lib/pricing';

// ============================================================================
// GENERIC SAFE FETCHERS
// ============================================================================

/**
 * Generic SELECT with automatic company_id filtering
 * @param table - Table name
 * @param companyId - Company ID to filter by
 * @param options - Optional query options (select, filters, etc.)
 */
export async function getCompanyData<T = any>(
    table: string,
    companyId: string,
    options?: {
        select?: string;
        filters?: Record<string, any>;
        orderBy?: { column: string; ascending?: boolean };
        limit?: number;
        single?: boolean;
    }
): Promise<T[]> {
    if (!companyId) {
        throw new Error('companyId is required for getCompanyData');
    }

    const supabase = createClient();
    let query = supabase
        .from(table)
        .select(options?.select || '*')
        .eq('company_id', companyId);

    // Apply additional filters
    if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                query = query.eq(key, value);
            }
        });
    }

    // Apply ordering
    if (options?.orderBy) {
        query = query.order(options.orderBy.column, {
            ascending: options.orderBy.ascending ?? true
        });
    }

    // Apply limit
    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data, error } = options?.single
        ? await query.single()
        : await query;

    if (error) {
        console.error(`Error fetching from ${table}:`, error);
        throw error;
    }

    return (options?.single ? [data] : data) as T[];
}

/**
 * Generic INSERT with automatic company_id injection
 */
export async function createCompanyData<T = any>(
    table: string,
    companyId: string,
    data: Omit<T, 'id' | 'created_at' | 'company_id'>
): Promise<T> {
    if (!companyId) {
        throw new Error('companyId is required for createCompanyData');
    }

    const supabase = createClient();
    const { data: result, error } = await supabase
        .from(table)
        .insert({
            ...data,
            company_id: companyId,
        })
        .select()
        .single();

    if (error) {
        console.error(`Error creating in ${table}:`, error);
        throw error;
    }

    return result as T;
}

/**
 * Generic UPDATE with company_id verification
 */
export async function updateCompanyData<T = any>(
    table: string,
    companyId: string,
    id: string,
    data: Partial<T>
): Promise<T> {
    if (!companyId) {
        throw new Error('companyId is required for updateCompanyData');
    }

    const supabase = createClient();
    const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .eq('company_id', companyId) // Security: verify ownership
        .select()
        .single();

    if (error) {
        console.error(`Error updating ${table}:`, error);
        throw error;
    }

    return result as T;
}

/**
 * Generic DELETE with company_id verification
 */
export async function deleteCompanyData(
    table: string,
    companyId: string,
    id: string
): Promise<void> {
    if (!companyId) {
        throw new Error('companyId is required for deleteCompanyData');
    }

    const supabase = createClient();
    const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
        .eq('company_id', companyId); // Security: verify ownership

    if (error) {
        console.error(`Error deleting from ${table}:`, error);
        throw error;
    }
}

// ============================================================================
// SPECIALIZED SAFE FETCHERS
// ============================================================================

/**
 * Fetch all halls for a company
 */
export async function getCompanyHalls(companyId: string): Promise<Hall[]> {
    return getCompanyData<Hall>('halls', companyId, {
        orderBy: { column: 'name', ascending: true }
    });
}

/**
 * Fetch a specific hall by ID with ownership verification
 */
export async function getCompanyHall(companyId: string, hallId: string): Promise<Hall | null> {
    const halls = await getCompanyData<Hall>('halls', companyId, {
        filters: { id: hallId },
        single: true
    });
    return halls[0] || null;
}

/**
 * Fetch a hall by slug with ownership verification
 */
export async function getCompanyHallBySlug(companyId: string, slug: string): Promise<Hall | null> {
    const halls = await getCompanyData<Hall>('halls', companyId, {
        filters: { slug },
        single: true
    });
    return halls[0] || null;
}

/**
 * Fetch all bookings for a company with optional filters
 */
export async function getCompanyBookings(
    companyId: string,
    filters?: {
        status?: string;
        futureOnly?: boolean;
        startDate?: string;
        endDate?: string;
        hallId?: string;
    }
): Promise<Booking[]> {
    const supabase = createClient();
    let query = supabase
        .from('bookings')
        .select(`
            *,
            client:clients(name, phone, email),
            hall:halls(name)
        `)
        .eq('company_id', companyId);

    if (filters?.status) {
        query = query.eq('status', filters.status);
    }

    if (filters?.futureOnly) {
        const today = format(new Date(), 'yyyy-MM-dd');
        query = query.gte('event_date', today);
    }

    if (filters?.startDate) {
        query = query.gte('event_date', filters.startDate);
    }

    if (filters?.endDate) {
        query = query.lte('event_date', filters.endDate);
    }

    if (filters?.hallId) {
        query = query.eq('hall_id', filters.hallId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching bookings:', error);
        throw error;
    }

    return data as Booking[];
}

/**
 * Fetch all clients for a company
 */
export async function getCompanyClients(companyId: string): Promise<Client[]> {
    return getCompanyData<Client>('clients', companyId, {
        orderBy: { column: 'name', ascending: true }
    });
}

/**
 * Search clients by name or phone
 */
export async function searchCompanyClients(
    companyId: string,
    query: string
): Promise<Client[]> {
    if (!companyId) {
        throw new Error('companyId is required');
    }

    const supabase = createClient();
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', companyId)
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(10);

    if (error) {
        console.error('Error searching clients:', error);
        return [];
    }

    return data as Client[];
}

/**
 * Fetch all payments for a company with optional filters
 */
export async function getCompanyPayments(
    companyId: string,
    filters?: {
        bookingId?: string;
        startDate?: string;
        endDate?: string;
    }
): Promise<Payment[]> {
    const supabase = createClient();
    let query = supabase
        .from('payments')
        .select('*')
        .eq('company_id', companyId);

    if (filters?.bookingId) {
        query = query.eq('booking_id', filters.bookingId);
    }

    if (filters?.startDate) {
        query = query.gte('payment_date', filters.startDate);
    }

    if (filters?.endDate) {
        query = query.lte('payment_date', filters.endDate);
    }

    query = query.order('payment_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching payments:', error);
        throw error;
    }

    return data as Payment[];
}

/**
 * Calculate monthly revenue for a company
 */
export async function getCompanyMonthlyRevenue(
    companyId: string,
    month?: Date
): Promise<number> {
    const targetMonth = month || new Date();
    const startMonth = format(startOfMonth(targetMonth), 'yyyy-MM-dd');
    const endMonth = format(endOfMonth(targetMonth), 'yyyy-MM-dd');

    const bookings = await getCompanyBookings(companyId, {
        startDate: startMonth,
        endDate: endMonth
    });

    // Filter out cancelled bookings
    const validBookings = bookings.filter(b => b.status !== 'cancelled');

    return validBookings.reduce((sum, booking) => sum + Number(booking.total_price), 0);
}

/**
 * Fetch calendar data for a hall with ownership verification
 */
export async function getCompanyCalendarData(
    companyId: string,
    hallId: string,
    startDate: Date,
    endDate: Date
): Promise<Record<string, DayDisplayState>> {
    if (!companyId) {
        throw new Error('companyId is required');
    }

    // CRITICAL: Verify hall ownership first
    const hall = await getCompanyHall(companyId, hallId);
    if (!hall) {
        throw new Error('Hall not found or does not belong to this company');
    }

    const supabase = createClient();
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');

    // Fetch all data in parallel with company_id filtering
    const [rulesRes, overridesRes, discountsRes, calendarRes, bookingsRes] = await Promise.all([
        supabase.from('pricing_rules')
            .select('*')
            .eq('company_id', companyId)
            .eq('hall_id', hallId)
            .order('rule_level', { ascending: false }),

        supabase.from('calendar_overrides')
            .select('*')
            .eq('company_id', companyId)
            .eq('hall_id', hallId)
            .gte('date', startStr)
            .lte('date', endStr),

        supabase.from('discounts')
            .select('*')
            .eq('company_id', companyId)
            .eq('hall_id', hallId)
            .eq('active', true),

        supabase.from('calendar_days')
            .select('*')
            .eq('company_id', companyId)
            .eq('hall_id', hallId)
            .gte('date', startStr)
            .lte('date', endStr),

        supabase.from('bookings')
            .select('*')
            .eq('company_id', companyId)
            .eq('hall_id', hallId)
            .gte('event_date', startStr)
            .lte('event_date', endStr)
            .neq('status', 'cancelled')
    ]);

    if (rulesRes.error) console.error('Error fetching rules:', rulesRes.error);
    if (overridesRes.error) console.error('Error fetching overrides:', overridesRes.error);
    if (discountsRes.error) console.error('Error fetching discounts:', discountsRes.error);
    if (calendarRes.error) console.error('Error fetching calendar:', calendarRes.error);
    if (bookingsRes.error) console.error('Error fetching bookings:', bookingsRes.error);

    const basePrice = hall.base_price || 0;
    const rules = (rulesRes.data || []) as PricingRule[];
    const overrides = (overridesRes.data || []) as CalendarOverride[];
    const discounts = (discountsRes.data || []) as Discount[];
    const calendarDays = calendarRes.data || [];
    const bookings = bookingsRes.data || [];

    // Calculate prices for each day
    const days: Record<string, DayDisplayState> = {};
    let current = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    while (current <= endDate) {
        const dateKey = format(current, 'yyyy-MM-dd');

        const priceBreakdown = calculatePriceLogic(
            current,
            basePrice,
            rules,
            overrides,
            discounts
        );

        const dayRecord = calendarDays.find((d) => d.date === dateKey);
        const booking = bookings.find((b) => b.event_date === dateKey);

        let status: CalendarDayStatus = 'available';

        if (booking) {
            status = 'booked';
        } else if (dayRecord?.status === 'maintenance') {
            status = 'maintenance';
        }

        let price: number | null = priceBreakdown.finalPrice;

        if (dayRecord?.manual_price !== null && dayRecord?.manual_price !== undefined) {
            price = dayRecord.manual_price;
        }

        if (status !== 'available') {
            price = null;
        }

        days[dateKey] = {
            date: dateKey,
            status,
            price,
            isPast: current < today,
        };

        current.setDate(current.getDate() + 1);
    }

    return days;
}

/**
 * Update day status with ownership verification
 */
export async function updateCompanyDayStatus(
    companyId: string,
    hallId: string,
    date: string,
    status: CalendarDayStatus,
    manualPrice?: number
): Promise<void> {
    if (!companyId) {
        throw new Error('companyId is required');
    }

    // Verify hall ownership
    const hall = await getCompanyHall(companyId, hallId);
    if (!hall) {
        throw new Error('Hall not found or does not belong to this company');
    }

    const supabase = createClient();
    const { error } = await supabase
        .from('calendar_days')
        .upsert(
            {
                hall_id: hallId,
                company_id: companyId,
                date,
                status,
                manual_price: manualPrice,
            },
            { onConflict: 'hall_id,date' }
        );

    if (error) throw error;
}

/**
 * Get company statistics for dashboard
 */
export async function getCompanyStats(companyId: string) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const startMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const endMonth = format(endOfMonth(new Date()), 'yyyy-MM-dd');

    const supabase = createClient();

    // Fetch stats in parallel
    const [hallsRes, activeBookingsRes, monthBookingsRes, recentBookingsRes] = await Promise.all([
        supabase.from('halls')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId),

        supabase.from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .neq('status', 'cancelled')
            .gte('event_date', today),

        supabase.from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .neq('status', 'cancelled')
            .gte('event_date', startMonth)
            .lte('event_date', endMonth),

        supabase.from('bookings')
            .select('*, hall:halls(name)')
            .eq('company_id', companyId)
            .neq('status', 'cancelled')
            .order('created_at', { ascending: false })
            .limit(5)
    ]);

    const hallsCount = hallsRes.count || 0;
    const activeBookingsCount = activeBookingsRes.count || 0;
    const monthBookingsCount = monthBookingsRes.count || 0;

    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const occupancyRate = monthBookingsCount ? Math.round((monthBookingsCount / daysInMonth) * 100) : 0;

    return {
        halls: hallsCount,
        bookings: activeBookingsCount,
        occupancy: occupancyRate,
        recentActivity: recentBookingsRes.data || [],
    };
}
