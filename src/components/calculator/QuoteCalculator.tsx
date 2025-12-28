"use client";

import { GlassButton } from "@/components/ui/GlassButton";
import { HallService } from "@/types";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { Check, Plus } from "lucide-react";
import { useMemo, useState } from "react";

interface QuoteCalculatorProps {
    date: string;
    basePrice: number;
    services: HallService[];
    onClose: () => void;
}

export function QuoteCalculator({ date, basePrice, services, onClose }: QuoteCalculatorProps) {
    const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());

    const toggleService = (id: string) => {
        const newSelected = new Set(selectedServiceIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedServiceIds(newSelected);
    };

    const totalServicesPrice = useMemo(() => {
        return services
            .filter((s) => selectedServiceIds.has(s.id))
            .reduce((sum, s) => sum + Number(s.price), 0);
    }, [services, selectedServiceIds]);

    const grandTotal = basePrice + totalServicesPrice;

    return (
        <div className="flex flex-col h-full" dir="rtl">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-1">
                    تقدير سعر {format(new Date(date), "d MMMM yyyy", { locale: arSA })}
                </h2>
                <p className="text-white/60 text-sm">
                    اختر الخدمات الإضافية لتخصيص الباقة.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto pe-2 space-y-3 mb-6 custom-scrollbar">
                {/* Base Rental Item */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div>
                        <h3 className="font-semibold text-white">إيجار القاعة الرئيسي</h3>
                        <p className="text-xs text-white/50">السعر الأساسي لليوم</p>
                    </div>
                    <div className="font-mono font-bold text-white">
                        {basePrice.toLocaleString()} ر.س
                    </div>
                </div>

                {/* Services List */}
                {services.map((service) => {
                    const isSelected = selectedServiceIds.has(service.id);
                    return (
                        <div
                            key={service.id}
                            onClick={() => toggleService(service.id)}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${isSelected
                                ? "bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                : "bg-white/5 border-white/10 hover:bg-white/10"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={`flex items-center justify-center w-6 h-6 rounded-full border transition-colors ${isSelected
                                        ? "bg-emerald-500 border-emerald-500 text-white"
                                        : "border-white/30 text-transparent"
                                        }`}
                                >
                                    <Check className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-white">{service.service?.name || "خدمة غير معروفة"}</h3>
                                </div>
                            </div>
                            <div className="font-mono font-bold text-white/90">
                                +{Number(service.price).toLocaleString()} ر.س
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary Footer */}
            <div className="mt-auto pt-6 border-t border-white/10">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-white/60">إجمالي التقدير</span>
                    <div className="text-end">
                        <span className="text-3xl font-bold text-white block leading-none">
                            {grandTotal.toLocaleString()} <span className="text-lg font-normal text-white/50">ر.س</span>
                        </span>
                    </div>
                </div>

                <p className="text-xs text-white/40 text-center mb-6">
                    * هذا تقدير غير ملزم. السعر النهائي يخضع للعقد والتوفر.
                </p>

                <div className="flex gap-3">
                    <GlassButton variant="secondary" className="flex-1" onClick={onClose}>
                        إغلاق
                    </GlassButton>
                    <GlassButton className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-100">
                        تواصل للحجز
                    </GlassButton>
                </div>
            </div>
        </div>
    );
}
