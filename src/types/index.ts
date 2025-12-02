export type Hall = {
    id: string;
    name: string;
    slug: string;
    theme_color: string;
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
