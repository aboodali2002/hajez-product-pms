
"use client";

import { MonthView } from "@/components/calendar/MonthView";
import { QuoteCalculator } from "@/components/calculator/QuoteCalculator";
import { Modal } from "@/components/ui/Modal";
import { getCalendarData, getHallBySlug, getHallServices } from "@/lib/supabase-data";
import { DayDisplayState, Hall, HallService } from "@/types";
import { addMonths } from "date-fns";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function HallPage() {
    const params = useParams();
    const slug = params.slug as string;

    // State
    const [hall, setHall] = useState<Hall | null>(null);
    const [services, setServices] = useState<HallService[]>([]);
    const [calendarData, setCalendarData] = useState<Record<string, DayDisplayState>>({});
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load initial data
    useEffect(() => {
        async function loadData() {
            try {
                const hallData = await getHallBySlug(slug);
                if (hallData) {
                    setHall(hallData);
                    const servicesData = await getHallServices(hallData.id);
                    setServices(servicesData);

                    const startDate = new Date();
                    const endDate = addMonths(startDate, 12);
                    const calendar = await getCalendarData(hallData.id, startDate, endDate);
                    setCalendarData(calendar);
                }
            } catch (error) {
                console.error("Failed to load hall data", error);
            } finally {
                setLoading(false);
            }
        }

        if (slug) {
            loadData();
        }
    }, [slug]);

    const handleDayClick = (date: string) => {
        const dayState = calendarData[date];
        if (dayState && dayState.status === "available" && !dayState.isPast) {
            setSelectedDate(date);
            setIsModalOpen(true);
        }
    };

    const selectedDayState = selectedDate ? calendarData[selectedDate] : null;

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
    }

    if (!hall) {
        return <div className="min-h-screen flex items-center justify-center text-white">Hall not found</div>;
    }

    return (
        <main className="min-h-screen p-4 sm:p-8 pb-20">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-8 text-center sm:text-left">
                    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-2">
                        {hall.name}
                    </h1>
                    <p className="text-white/60 text-lg">
                        Check availability and plan your perfect event.
                    </p>
                </header>

                {/* Calendar */}
                <div className="backdrop-blur-sm bg-black/20 rounded-3xl border border-white/5 p-4 sm:p-8 shadow-2xl">
                    <MonthView
                        dayStates={calendarData}
                        onDayClick={handleDayClick}
                    />
                </div>
            </div>

            {/* Calculator Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                className="sm:max-w-md"
            >
                {selectedDayState && (
                    <QuoteCalculator
                        date={selectedDayState.date}
                        basePrice={selectedDayState.price || 0}
                        services={services}
                        onClose={() => setIsModalOpen(false)}
                    />
                )}
            </Modal>
        </main>
    );
}

