"use client";

import { MonthView } from "@/components/calendar/MonthView";
import { GlassButton } from "@/components/ui/GlassButton";
import { Modal } from "@/components/ui/Modal";
import { DayDisplayState } from "@/types";
import { addMonths, format } from "date-fns";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useCompanyId } from "@/context/AuthContext";
import {
    getCompanyHalls,
    getCompanyCalendarData,
    updateCompanyDayStatus
} from "@/services/data-service";

import { createQuickBookingAction, searchClientsAction } from "@/app/admin/bookings/actions";

// ... imports

export default function AdminCalendarPage() {
    const [calendarData, setCalendarData] = useState<Record<string, DayDisplayState>>({});
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentHallId, setCurrentHallId] = useState<string | null>(null);
    const [halls, setHalls] = useState<any[]>([]);

    // Get company_id from auth context
    const companyId = useCompanyId();

    const fetchCalendarData = async (hallId: string) => {
        setLoading(true);
        try {
            const today = new Date();
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);

            // Use safe data service with company_id
            const data = await getCompanyCalendarData(companyId, hallId, start, end);
            setCalendarData(data);
        } catch (error) {
            console.error("Failed to fetch calendar data:", error);
            toast.error("فشل تحديث التقويم");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        async function init() {
            try {
                if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
                    console.error("NEXT_PUBLIC_SUPABASE_URL is missing!");
                    toast.error("Configuration Error: NEXT_PUBLIC_SUPABASE_URL is missing. Please check your .env file and restart the server.");
                    setLoading(false);
                    return;
                }

                // Fetch halls using safe data service
                const fetchedHalls = await getCompanyHalls(companyId);
                setHalls(fetchedHalls);

                if (fetchedHalls.length > 0) {
                    setCurrentHallId(fetchedHalls[0].id);
                } else {
                    console.log("No halls found.");
                    setLoading(false);
                }
            } catch (error) {
                console.error("Failed to initialize calendar:", error);
                setLoading(false);
            }
        }

        init();
    }, [companyId]);

    useEffect(() => {
        if (currentHallId) {
            fetchCalendarData(currentHallId);
        }
    }, [currentHallId, companyId]); // Added companyId to prevent stale closures

    // Modal State
    const [activeTab, setActiveTab] = useState<'status' | 'booking'>('status');
    const [manualPrice, setManualPrice] = useState<string>("");

    // Booking Form State
    const [clientSearch, setClientSearch] = useState("");
    const [clientSuggestions, setClientSuggestions] = useState<any[]>([]);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [clientPhone, setClientPhone] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleClientSearch = async (query: string) => {
        if (query.length > 1) {
            const results = await searchClientsAction(query);
            setClientSuggestions(results);
        } else {
            setClientSuggestions([]);
        }
    };

    const handleDayClick = (date: string) => {
        setSelectedDate(date);
        const currentPrice = calendarData[date]?.price;
        setManualPrice(currentPrice ? currentPrice.toString() : "");

        // Reset Booking Form
        setActiveTab('status');
        setClientSearch("");
        setClientPhone("");
        setSelectedClient(null);
        setClientSuggestions([]);

        setIsModalOpen(true);
    };

    const updateStatus = async (status: "available" | "booked" | "maintenance") => {
        if (!selectedDate || !currentHallId) return;

        try {
            const priceValue = manualPrice ? parseFloat(manualPrice) : undefined;

            // Use safe data service with company_id verification
            await updateCompanyDayStatus(
                companyId,
                currentHallId,
                selectedDate,
                status,
                status === "available" ? priceValue : undefined
            );

            // Optimistic update or refetch
            setCalendarData(prev => ({
                ...prev,
                [selectedDate]: {
                    ...prev[selectedDate],
                    status,
                    price: status === "available" ? (priceValue || prev[selectedDate].price || 5000) : null
                }
            }));
            setIsModalOpen(false);
            toast.success("تم تحديث الحالة بنجاح");
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error("فشل تحديث الحالة");
        }
    };

    if (loading) return <div className="text-white p-8">جاري تحميل التقويم...</div>;
    if (!currentHallId) return <div className="text-white p-8">لم يتم العثور على قاعات. يرجى إنشاء قاعة في قاعدة البيانات أولاً.</div>;

    return (
        <div dir="rtl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">إدارة التقويم</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-white/60 text-sm">عرض القاعة:</span>
                        <select
                            value={currentHallId || ''}
                            onChange={(e) => setCurrentHallId(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-white/30 [&>option]:bg-zinc-900"
                        >
                            {halls.map(hall => (
                                <option key={hall.id} value={hall.id}>{hall.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <GlassButton onClick={() => setIsModalOpen(true)}>+ إضافة حجز</GlassButton>
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
                title={selectedDate ? `إدارة ${format(new Date(selectedDate), "yyyy/MM/dd")}` : "إدارة التاريخ"}
                className="sm:max-w-md"
            >
                <div className="space-y-4">
                    <div className="flex gap-2 border-b border-white/10 pb-2 mb-4">
                        <button
                            onClick={() => setActiveTab('status')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'status' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                        >
                            الحالة والسعر
                        </button>
                        <button
                            onClick={() => setActiveTab('booking')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'booking' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                        >
                            حجز سريع
                        </button>
                    </div>

                    {activeTab === 'status' ? (
                        <>
                            <p className="text-sm text-white/60">تغيير حالة أو سعر هذا التاريخ.</p>
                            <div className="space-y-2">
                                <label className="text-sm text-white/60">سعر يدوي (ر.س)</label>
                                <input
                                    type="number"
                                    value={manualPrice}
                                    onChange={(e) => setManualPrice(e.target.value)}
                                    placeholder="اتركه فارغاً لاستخدام السعر المحسوب"
                                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30"
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                <GlassButton
                                    onClick={() => updateStatus("available")}
                                    className="bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-100 justify-start"
                                >
                                    حفظ كـ متاح / تحديث السعر
                                </GlassButton>
                                <GlassButton
                                    onClick={() => updateStatus("maintenance")}
                                    className="bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/30 text-amber-100 justify-start"
                                >
                                    حفظ كـ صيانة
                                </GlassButton>
                            </div>
                        </>
                    ) : (
                        <form action={async (formData) => {
                            if (isSubmitting) return; // Prevent double-click
                            setIsSubmitting(true);

                            try {
                                await createQuickBookingAction(formData)

                                // Refresh calendar data to show updated availability
                                if (currentHallId) {
                                    await fetchCalendarData(currentHallId);
                                }

                                setIsModalOpen(false)
                                toast.success('تم إنشاء الحجز بنجاح!')
                            } catch (e: any) {
                                toast.error(e.message || 'فشل إنشاء الحجز')
                            } finally {
                                setIsSubmitting(false);
                            }
                        }} className="space-y-4">
                            <input type="hidden" name="hall_id" value={currentHallId || ''} />
                            <input type="hidden" name="event_date" value={selectedDate || ''} />
                            <input type="hidden" name="client_id" value={selectedClient?.id || ''} />

                            <div className="relative">
                                <label className="block text-sm text-white/60 mb-1">اسم العميل</label>
                                <input
                                    name="client_name"
                                    required
                                    value={clientSearch}
                                    onChange={(e) => {
                                        setClientSearch(e.target.value)
                                        handleClientSearch(e.target.value)
                                    }}
                                    placeholder="ابحث أو اكتب اسماً جديداً..."
                                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30"
                                    autoComplete="off"
                                />
                                {clientSuggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-xl">
                                        {clientSuggestions.map(client => (
                                            <button
                                                key={client.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedClient(client)
                                                    setClientSearch(client.name)
                                                    setClientPhone(client.phone)
                                                    setClientSuggestions([])
                                                }}
                                                className="w-full px-4 py-2 text-start text-white hover:bg-white/10 text-sm"
                                            >
                                                {client.name} ({client.phone})
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm text-white/60 mb-1">رقم الهاتف</label>
                                <input
                                    name="client_phone"
                                    required
                                    value={clientPhone}
                                    onChange={(e) => setClientPhone(e.target.value)}
                                    placeholder="مثال 0501234567"
                                    dir="ltr"
                                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 text-end"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-white/60 mb-1">السعر الإجمالي (ر.س)</label>
                                <input
                                    name="total_price"
                                    type="number"
                                    required
                                    defaultValue={manualPrice || calendarData[selectedDate || '']?.price || 5000}
                                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30"
                                />
                            </div>

                            <GlassButton
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full bg-white text-black hover:bg-white/90 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? 'جاري إنشاء الحجز...' : 'تأكيد الحجز'}
                            </GlassButton>
                        </form>
                    )}
                </div>
            </Modal>
        </div>
    );
}
