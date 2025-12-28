import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { DayDisplayState } from "@/types";
import { format, isSameMonth } from "date-fns";
import { Lock, Wrench } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface DayCellProps {
    day: Date;
    currentMonth: Date;
    state: DayDisplayState;
    onClick: (date: string) => void;
}


export function DayCell({ day, currentMonth, state, onClick }: DayCellProps) {
    const { t } = useLanguage();
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isBooked = state.status === "booked";
    const isMaintenance = state.status === "maintenance";
    const isAvailable = state.status === "available";
    const isPast = state.isPast;

    // Base classes for the cell
    const cellClasses = cn(
        "relative flex flex-col items-center justify-center p-2 h-24 sm:h-32 transition-all duration-300 border-white/10",
        !isCurrentMonth && "opacity-30 grayscale",
        isPast && "opacity-50 cursor-not-allowed",
        !isPast && isAvailable && "cursor-pointer hover:scale-[1.02] hover:bg-white/20 hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]",
        !isPast && (isBooked || isMaintenance) && "cursor-not-allowed opacity-90"
    );

    // Status-specific styling
    const statusClasses = cn(
        isAvailable && "bg-emerald-500/10 border-emerald-500/20 text-emerald-100",
        isBooked && "bg-red-500/10 border-red-500/20 text-red-100",
        isMaintenance && "bg-amber-500/10 border-amber-500/20 text-amber-100"
    );

    const handleClick = () => {
        if (!isPast && isAvailable) {
            onClick(state.date);
        }
    };

    return (
        <GlassCard
            className={cn(cellClasses, statusClasses)}
            onClick={handleClick}
        >
            <span className="absolute top-2 right-2 text-sm font-medium opacity-70">
                {format(day, "d")}
            </span>

            <div className="flex flex-col items-center justify-center gap-1 mt-4 w-full">
                {/* Mobile View: Status Dot */}
                <div className="md:hidden flex justify-center mt-1">
                    {isBooked && <div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]" />}
                    {isMaintenance && <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />}
                    {isAvailable && !isPast && <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
                </div>

                {/* Desktop View: Full Details */}
                <div className="hidden md:flex flex-col items-center">
                    {isBooked && (
                        <>
                            <Lock className="w-6 h-6 text-red-400 mb-1" />
                            <span className="text-xs font-bold tracking-wider text-red-200">{t.calendar.status.booked}</span>
                        </>
                    )}

                    {isMaintenance && (
                        <>
                            <Wrench className="w-6 h-6 text-amber-400 mb-1" />
                            <span className="text-xs font-bold tracking-wider text-amber-200">{t.calendar.status.maintenance}</span>
                        </>
                    )}

                    {isAvailable && !isPast && (
                        <>
                            <span className="text-xs uppercase tracking-widest text-emerald-200/70 mb-1">{t.calendar.status.startingFrom}</span>
                            <span className="text-lg sm:text-xl font-bold text-white drop-shadow-md">
                                {state.price?.toLocaleString()} <span className="text-xs font-normal opacity-70">{t.currency.sar}</span>
                            </span>
                        </>
                    )}
                </div>
            </div>
        </GlassCard>
    );
}
