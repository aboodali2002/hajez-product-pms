import { cn } from "@/lib/utils";
import React from "react";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger";
    size?: "sm" | "md" | "lg";
}

export function GlassButton({
    children,
    className,
    variant = "primary",
    size = "md",
    ...props
}: GlassButtonProps) {
    const variants = {
        primary:
            "bg-white/20 hover:bg-white/30 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]",
        secondary:
            "bg-black/10 hover:bg-black/20 border-white/10 text-white/80",
        danger:
            "bg-red-500/20 hover:bg-red-500/30 border-red-500/20 text-red-100",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg",
    };

    return (
        <button
            className={cn(
                "relative inline-flex items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-300 active:scale-95 disabled:pointer-events-none disabled:opacity-50",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
