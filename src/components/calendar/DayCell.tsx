import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { DayDisplayState } from "@/types";
import { format, isSameMonth } from "date-fns";
import { Lock, Wrench } from "lucide-react";

interface DayCellProps {
    day: Date;
    currentMonth: Date;
    state: DayDisplayState;
    onClick: (date: string) => void;
}

export function DayCell({ day, currentMonth, state, onClick }: DayCellProps) {
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
            <span className="absolute top-2 left-2 text-sm font-medium opacity-70">
                {format(day, "d")}
            </span>

            <div className="flex flex-col items-center justify-center gap-1 mt-4">
                {isBooked && (
                    <>
                        <Lock className="w-6 h-6 text-red-400 mb-1" />
                        <span className="text-xs font-bold tracking-wider text-red-200">BOOKED</span>
                    </>
                )}

                {isMaintenance && (
                    <>
                        <Wrench className="w-6 h-6 text-amber-400 mb-1" />
                        <span className="text-xs font-bold tracking-wider text-amber-200">MAINTENANCE</span>
                    </>
                )}

                {isAvailable && !isPast && (
                    <>
                        <span className="text-xs uppercase tracking-widest text-emerald-200/70 mb-1">Starting at</span>
                        <span className="text-lg sm:text-xl font-bold text-white drop-shadow-md">
                            {state.price?.toLocaleString()} <span className="text-xs font-normal opacity-70">SAR</span>
                        </span>
                    </>
                )}
            </div>
        </GlassCard>
    );
}
