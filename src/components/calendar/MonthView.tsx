"use client";

import { DayCell } from "@/components/calendar/DayCell";
import { GlassButton } from "@/components/ui/GlassButton";
import { DayDisplayState } from "@/types";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { arSA } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

interface MonthViewProps {
    initialDate?: Date;
    dayStates: Record<string, DayDisplayState>; // Key: YYYY-MM-DD
    onDayClick: (date: string) => void;
    minDate?: Date;
    maxDate?: Date;
}

export function MonthView({
    initialDate = new Date(),
    dayStates,
    onDayClick,
    minDate = new Date(),
    maxDate = addMonths(new Date(), 12)
}: MonthViewProps) {
    const [currentMonth, setCurrentMonth] = useState(initialDate);
    const { t, language, dir } = useLanguage();

    const nextMonth = () => {
        const next = addMonths(currentMonth, 1);
        if (next <= maxDate) setCurrentMonth(next);
    };

    const prevMonth = () => {
        const prev = subMonths(currentMonth, 1);
        if (prev >= startOfMonth(minDate)) setCurrentMonth(prev);
    };

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = [
        t.calendar.weekDays.sunday,
        t.calendar.weekDays.monday,
        t.calendar.weekDays.tuesday,
        t.calendar.weekDays.wednesday,
        t.calendar.weekDays.thursday,
        t.calendar.weekDays.friday,
        t.calendar.weekDays.saturday,
    ];

    const locale = language === "ar" ? arSA : enUS;

    return (
        <div className="w-full max-w-6xl mx-auto p-4" dir={dir}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                    {format(currentMonth, "MMMM yyyy", { locale })}
                </h2>
                <div className="flex gap-2">
                    <GlassButton onClick={prevMonth} disabled={currentMonth <= startOfMonth(minDate)} size="sm">
                        <ChevronLeft className="w-5 h-5 flip-rtl" />
                    </GlassButton>
                    <GlassButton onClick={nextMonth} disabled={currentMonth >= startOfMonth(maxDate)} size="sm">
                        <ChevronRight className="w-5 h-5 flip-rtl" />
                    </GlassButton>
                </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {weekDays.map((day) => (
                    <div key={day} className="text-center text-white/60 font-medium text-sm uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 sm:gap-4">
                {days.map((day) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    // Default state if not provided
                    const state = dayStates[dateKey] || {
                        date: dateKey,
                        status: "available",
                        price: 5000, // Fallback
                        isPast: day < new Date(new Date().setHours(0, 0, 0, 0)),
                    };

                    return (
                        <DayCell
                            key={day.toString()}
                            day={day}
                            currentMonth={currentMonth}
                            state={state}
                            onClick={onDayClick}
                        />
                    );
                })}
            </div>
        </div >
    );
}
