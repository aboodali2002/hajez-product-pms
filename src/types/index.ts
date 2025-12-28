export type Hall = {
    id: string;
    name: string;
    slug: string;
    theme_color: string;
    base_price: number;
};

export type PricingRule = {
    id: string;
    hall_id: string;
    name: string;
    rule_level: 1 | 2 | 3;
    start_date: string | null;
    end_date: string | null;
    days_of_week: number[] | null;
    adjustment_type: 'fixed' | 'flat' | 'percent';
    adjustment_value: number;
};

export type CalendarOverride = {
    id: string;
    hall_id: string;
    date: string;
    price: number;
};

export type Discount = {
    id: string;
    hall_id: string;
    name: string;
    type: 'percent' | 'flat';
    value: number;
    min_advance_booking_days: number;
    active: boolean;
};

export type Service = {
    id: string;
    name: string;
    is_global: boolean;
};

export type HallService = {
    id: string;
    hall_id: string;
    service_id: string;
    price: number;
    service?: Service; // Joined
};

export type PricingTemplate = {
    id: string;
    hall_id: string;
    day_of_week: number; // 0-6
    price: number;
};

export type CalendarDayStatus = 'available' | 'booked' | 'maintenance';

export type CalendarDay = {
    id: string;
    hall_id: string;
    date: string; // YYYY-MM-DD
    status: CalendarDayStatus;
    manual_price: number | null;
};

export type DayDisplayState = {
    date: string;
    status: CalendarDayStatus;
    price: number | null; // Null if booked/maintenance
    isPast: boolean;
};

export type Client = {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    national_id: string | null;
    notes: string | null;
    created_at: string;
};

export type BookingStatus = 'tentative' | 'confirmed' | 'cancelled' | 'completed';

export type Booking = {
    id: string;
    hall_id: string;
    client_id: string;
    event_date: string;
    total_price: number;
    status: BookingStatus;
    financial_status: 'unpaid' | 'partially_paid' | 'fully_paid' | 'overpaid';
    deposit_percentage: number;
    notes: string | null;
    cancellation_reason: string | null;
    created_by: string | null;
    created_at: string;
    client?: Client; // Joined
    hall?: Hall; // Joined
};

export type PaymentType = 'deposit' | 'full_payment' | 'remaining' | 'refund';
export type PaymentCategory = 'deposit' | 'settlement' | 'refund';
export type PaymentMethod = 'cash' | 'transfer' | 'card';

export type Payment = {
    id: string;
    booking_id: string;
    amount: number;
    payment_date: string;
    payment_method: PaymentMethod;
    payment_type: PaymentType; // Legacy/UI specific
    payment_category: PaymentCategory;
    reference_no: string | null;
    notes: string | null;
    created_at: string;
};

export type BookingService = {
    id: string;
    booking_id: string;
    service_name: string;
    price: number;
    quantity: number;
    created_at: string;
};

// ============================================================================
// MULTI-TENANT TYPES
// ============================================================================

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'suspended' | 'cancelled';

export type Company = {
    id: string;
    name: string;
    slug: string;
    owner_id: string;
    subscription_tier: SubscriptionTier;
    subscription_status: SubscriptionStatus;
    max_halls: number;
    max_users: number;
    logo_url: string | null;
    primary_color: string;
    created_at: string;
    updated_at: string;
};

export type UserRole = 'platform_admin' | 'company_owner' | 'company_admin' | 'hall_manager';

export type Profile = {
    id: string;
    email: string | null;
    role: UserRole;
    company_id: string | null; // null only for platform_admin
    assigned_hall_id: string | null;
    full_name: string | null;
    created_at: string;
};
