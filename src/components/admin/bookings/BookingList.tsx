'use client'

import { useState } from 'react'
import { Booking, BookingStatus } from '@/types'
import { Search, Filter, ChevronRight, Calendar, Building2, User } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

type BookingWithDetails = Booking & {
    client_name: string;
    hall_name: string;
    paid_amount: number;
}

import { arSA } from "date-fns/locale";

// ... previous imports

export function BookingList({ bookings }: { bookings: BookingWithDetails[] }) {
    const [filter, setFilter] = useState<BookingStatus | 'all'>('all')
    const [searchTerm, setSearchTerm] = useState('')

    const filteredBookings = bookings.filter(booking => {
        const matchesFilter = filter === 'all' || booking.status === filter
        const matchesSearch =
            booking.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.hall_name.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesFilter && matchesSearch
    })

    const getStatusColor = (status: BookingStatus) => {
        switch (status) {
            case 'confirmed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
            case 'tentative': return 'bg-amber-500/20 text-amber-400 border-amber-500/20'
            case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/20'
            case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/20'
            default: return 'bg-white/10 text-white/60 border-white/10'
        }
    }

    const statusMap: Record<string, string> = {
        all: "الكل",
        tentative: "حجز مبدئي",
        confirmed: "حجز مؤكد",
        cancelled: "ملغي",
        completed: "مكتمل"
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                    {(['all', 'tentative', 'confirmed', 'cancelled'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === status
                                ? 'bg-white text-black shadow-lg'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {statusMap[status] || status}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        type="text"
                        placeholder="بحث في الحجوزات..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pe-10 ps-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30"
                    />
                </div>
            </div>

            {/* Table */}
            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-4">
                {filteredBookings.map((booking) => (
                    <Link
                        key={booking.id}
                        href={`/admin/bookings/${booking.id}`}
                        className="block bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm active:scale-[0.98] transition-all"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{booking.client_name}</h3>
                                    <div className="flex items-center gap-1 text-xs text-white/60 mt-0.5">
                                        <Building2 className="w-3 h-3" />
                                        {booking.hall_name}
                                    </div>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                                {statusMap[booking.status] || booking.status}
                            </span>
                        </div>

                        <div className="flex justify-between items-center text-sm border-t border-white/5 pt-3">
                            <div className="flex items-center gap-2 text-white/80">
                                <Calendar className="w-4 h-4 text-white/40" />
                                {format(new Date(booking.event_date), 'd MMM yyyy', { locale: arSA })}
                            </div>
                            <div className="text-end">
                                <div className="font-medium text-white">{booking.total_price.toLocaleString()} ر.س</div>
                            </div>
                        </div>
                    </Link>
                ))}
                {filteredBookings.length === 0 && (
                    <div className="text-center py-12 text-white/40">
                        لم يتم العثور على حجوزات تطابق بحثك.
                    </div>
                )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-start">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="p-4 text-sm font-medium text-white/60">العميل</th>
                                <th className="p-4 text-sm font-medium text-white/60">تاريخ المناسبة</th>
                                <th className="p-4 text-sm font-medium text-white/60">القاعة</th>
                                <th className="p-4 text-sm font-medium text-white/60">الحالة</th>
                                <th className="p-4 text-sm font-medium text-white/60">الدفع</th>
                                <th className="p-4 text-sm font-medium text-white/60"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredBookings.map((booking) => (
                                <tr
                                    key={booking.id}
                                    className="group hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                    <td className="p-4">
                                        <Link href={`/admin/bookings/${booking.id}`} className="block">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <span className="font-medium text-white">{booking.client_name}</span>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="p-4">
                                        <Link href={`/admin/bookings/${booking.id}`} className="block">
                                            <div className="flex items-center gap-2 text-white/80">
                                                <Calendar className="w-4 h-4 text-white/40" />
                                                {format(new Date(booking.event_date), 'd MMM yyyy', { locale: arSA })}
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="p-4">
                                        <Link href={`/admin/bookings/${booking.id}`} className="block">
                                            <div className="flex items-center gap-2 text-white/80">
                                                <Building2 className="w-4 h-4 text-white/40" />
                                                {booking.hall_name}
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="p-4">
                                        <Link href={`/admin/bookings/${booking.id}`} className="block">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                                                {statusMap[booking.status] || booking.status}
                                            </span>
                                        </Link>
                                    </td>
                                    <td className="p-4">
                                        <Link href={`/admin/bookings/${booking.id}`} className="block">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">
                                                    {booking.total_price.toLocaleString()} ر.س
                                                </span>
                                                <span className="text-xs text-white/40">
                                                    مدفوع: {booking.paid_amount.toLocaleString()} ر.س
                                                </span>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="p-4 text-end">
                                        <Link
                                            href={`/admin/bookings/${booking.id}`}
                                            className="inline-flex p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                        >
                                            <ChevronRight className="w-5 h-5 flip-rtl" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredBookings.length === 0 && (
                    <div className="text-center py-12 text-white/40">
                        لم يتم العثور على حجوزات تطابق بحثك.
                    </div>
                )}
            </div>
        </div>
    )
}
