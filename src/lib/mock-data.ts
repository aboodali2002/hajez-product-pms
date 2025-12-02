import { CalendarDay, DayDisplayState, Hall, HallService } from "@/types";
import { addDays, format, startOfMonth } from "date-fns";

export const MOCK_HALL: Hall = {
    id: "1",
    name: "Grand Ballroom",
    slug: "grand-ballroom",
    theme_color: "blue",
};

export const MOCK_SERVICES: HallService[] = [
    {
        id: "s1",
        hall_id: "1",
        service_id: "gs1",
        price: 1500,
        service: { id: "gs1", name: "DJ & Sound System", is_global: true },
    },
    {
        id: "s2",
        hall_id: "1",
        service_id: "gs2",
        price: 3000,
        service: { id: "gs2", name: "Floral Decoration (Premium)", is_global: true },
    },
    {
        id: "s3",
        hall_id: "1",
        service_id: "gs3",
        price: 800,
        service: { id: "gs3", name: "Valet Parking", is_global: true },
    },
    {
        id: "s4",
        hall_id: "1",
        service_id: "gs4",
        price: 5000,
        service: { id: "gs4", name: "Catering (Buffet for 100)", is_global: true },
    },
];

export function generateMockCalendar(startDate: Date, months: number = 12): Record<string, DayDisplayState> {
    const days: Record<string, DayDisplayState> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = addDays(startDate, months * 30);
    let current = startDate;

    while (current <= end) {
        const dateKey = format(current, "yyyy-MM-dd");
        const dayOfWeek = current.getDay();
        const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Fri/Sat in many places, or Thu/Fri. Let's assume Fri/Sat for pricing.

        // Randomly book some days
        const isBooked = Math.random() < 0.3;
        const isMaintenance = !isBooked && Math.random() < 0.05;

        let status: "available" | "booked" | "maintenance" = "available";
        if (isBooked) status = "booked";
        if (isMaintenance) status = "maintenance";

        // Pricing logic
        let price = 5000; // Weekday base
        if (dayOfWeek === 5) price = 8000; // Friday
        if (dayOfWeek === 6) price = 7000; // Saturday (or Thursday depending on region, assuming Sat here)

        days[dateKey] = {
            date: dateKey,
            status,
            price: status === "available" ? price : null,
            isPast: current < today,
        };

        current = addDays(current, 1);
    }

    return days;
}
