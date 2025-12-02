"use client";

import { MonthView } from "@/components/calendar/MonthView";
import { GlassButton } from "@/components/ui/GlassButton";
import { Modal } from "@/components/ui/Modal";
import { getCalendarData, updateDayStatus } from "@/lib/supabase-data";
import { DayDisplayState } from "@/types";
import { addMonths, format } from "date-fns";
import { useEffect, useState } from "react";

export default function AdminCalendarPage() {
    const [calendarData, setCalendarData] = useState<Record<string, DayDisplayState>>({});
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function init() {
            // Fetch the first hall to manage
            // In a real app, this comes from the user's assigned hall
            const { createClient } = await import("@/utils/supabase/client");
            const supabase = createClient();
            const { data: hall } = await supabase.from("halls").select("id").limit(1).single();

            if (hall) {
                const startDate = new Date();
                const endDate = addMonths(startDate, 12);
                const data = await getCalendarData(hall.id, startDate, endDate);
                setCalendarData(data);
                // Store hall ID in state or ref if needed for updates
                // For this simple version, I'll just use the closure or state if I had it
                // But I need to pass hall.id to updateDayStatus.
                // Let's store it.
                setCurrentHallId(hall.id);
            }
            setLoading(false);
        }
        init();
    }, []);

    const [currentHallId, setCurrentHallId] = useState<string | null>(null);

    const handleDayClick = (date: string) => {
        setSelectedDate(date);
        setIsModalOpen(true);
    };

    const updateStatus = async (status: "available" | "booked" | "maintenance") => {
        if (!selectedDate || !currentHallId) return;

        try {
            await updateDayStatus(currentHallId, selectedDate, status, status === "available" ? 5000 : undefined);

            // Optimistic update or refetch
            setCalendarData(prev => ({
                ...prev,
                [selectedDate]: {
                    ...prev[selectedDate],
                    status,
                    price: status === "available" ? (prev[selectedDate].price || 5000) : null
                }
            }));
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status");
        }
    };

    if (loading) return <div className="text-white p-8">Loading calendar...</div>;
    if (!currentHallId) return <div className="text-white p-8">No halls found. Please create a hall in the database first.</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white">Calendar Management</h1>
                <GlassButton>+ Add Booking</GlassButton>
            </div>

            <div className="bg-black/20 rounded-3xl border border-white/5 p-4 sm:p-8">
                <MonthView
                    dayStates={calendarData}
                    onDayClick={handleDayClick}
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedDate ? `Manage ${format(new Date(selectedDate), "MMMM d, yyyy")}` : "Manage Date"}
                className="sm:max-w-md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-white/60">Change the status of this date.</p>

                    <div className="grid grid-cols-1 gap-3">
                        <GlassButton
                            onClick={() => updateStatus("available")}
                            className="bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-100 justify-start"
                        >
                            Mark as Available
                        </GlassButton>
                        <GlassButton
                            onClick={() => updateStatus("booked")}
                            className="bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-100 justify-start"
                        >
                            Mark as Booked
                        </GlassButton>
                        <GlassButton
                            onClick={() => updateStatus("maintenance")}
                            className="bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/30 text-amber-100 justify-start"
                        >
                            Mark as Maintenance
                        </GlassButton>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
