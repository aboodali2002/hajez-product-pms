"use client";

import { useLanguage } from "@/context/LanguageContext";
import { GlassButton } from "./GlassButton";
import { Languages } from "lucide-react";

export function LanguageToggle() {
    const { language, setLanguage } = useLanguage();

    const toggleLanguage = () => {
        setLanguage(language === "ar" ? "en" : "ar");
    };

    return (
        <GlassButton
            onClick={toggleLanguage}
            size="sm"
            className="flex items-center gap-2"
            title={language === "ar" ? "Switch to English" : "التبديل إلى العربية"}
        >
            <Languages className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">
                {language === "ar" ? "EN" : "ع"}
            </span>
        </GlassButton>
    );
}
