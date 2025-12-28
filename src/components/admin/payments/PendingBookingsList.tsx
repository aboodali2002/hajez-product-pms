'use client'

import { Booking } from '@/types'
import { format } from 'date-fns'
import Link from 'next/link'
import { Calendar, Building2, User, ArrowRight, AlertCircle } from 'lucide-react'
import { arSA } from "date-fns/locale";

type PendingBooking = Booking & {
    client_name: string;
    hall_name: string;
    paid_amount: number;
}

export function PendingBookingsList({ bookings }: { bookings: PendingBooking[] }) {
    if (bookings.length === 0) return null

    const statusMap: Record<string, string> = {
        tentative: 'حجز مبدئي',
        confirmed: 'حجز مؤكد',
        cancelled: 'ملغي',
        completed: 'مكتمل'
    };

    const financialStatusMap: Record<string, string> = {
        paid: 'مدفوع',
        partially_paid: 'مدفوع جزئياً',
        unpaid: 'غير مدفوع'
    };


    return (
        <div className="mb-12" dir="rtl">
            <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-semibold text-white">حجوزات معلقة</h2>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-start">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="p-4 text-sm font-medium text-white/60">العميل</th>
                                <th className="p-4 text-sm font-medium text-white/60">تاريخ المناسبة</th>
                                <th className="p-4 text-sm font-medium text-white/60">القاعة</th>
                                <th className="p-4 text-sm font-medium text-white/60">الحالة</th>
                                <th className="p-4 text-sm font-medium text-white/60">حالة الدفع</th>
                                <th className="p-4 text-sm font-medium text-white/60">الرصيد/المتبقي</th>
                                <th className="p-4 text-sm font-medium text-white/60"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {bookings.map((booking) => {
                                const remaining = booking.total_price - booking.paid_amount
                                return (
                                    <tr
                                        key={booking.id}
                                        className="group hover:bg-white/5 transition-colors"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <span className="font-medium text-white">{booking.client_name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-white/80">
                                                <Calendar className="w-4 h-4 text-white/40" />
                                                {format(new Date(booking.event_date), 'd MMM yyyy', { locale: arSA })}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-white/80">
                                                <Building2 className="w-4 h-4 text-white/40" />
                                                {booking.hall_name}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
                                                'bg-amber-500/20 text-amber-400 border-amber-500/20'
                                                }`}>
                                                {statusMap[booking.status] || booking.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${booking.financial_status === 'partially_paid' ? 'bg-orange-500/20 text-orange-400 border-orange-500/20' :
                                                'bg-red-500/20 text-red-400 border-red-500/20'
                                                }`}>
                                                {booking.financial_status ? (financialStatusMap[booking.financial_status] || booking.financial_status) : 'غير مدفوع'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">
                                                    {remaining.toLocaleString()} ر.س
                                                </span>
                                                <span className="text-xs text-white/40">
                                                    من {booking.total_price.toLocaleString()} ر.س
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-end">
                                            <Link
                                                href={`/admin/bookings/${booking.id}`}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black hover:bg-white/90 text-sm font-medium transition-colors"
                                            >
                                                تسجيل دفعة
                                                <ArrowRight className="w-4 h-4 flip-rtl" />
                                            </Link>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
