'use client'

import { Client, Booking } from '@/types'
import { format } from 'date-fns'
import Link from 'next/link'
import {
    User, Phone, Mail, FileText, Calendar, Building2,
    DollarSign, ArrowLeft, Clock, CheckCircle, XCircle
} from 'lucide-react'
import { GlassButton } from '@/components/ui/GlassButton'
import { arSA } from "date-fns/locale";

type ClientDetailProps = {
    client: Client;
    bookings: (Booking & { hall: { name: string } })[];
}

export function ClientDetail({ client, bookings }: ClientDetailProps) {
    // Calculate Stats
    const totalBookings = bookings.length
    const totalSpent = bookings.reduce((sum, b) => sum + b.total_price, 0)
    const completedBookings = bookings.filter(b => b.status === 'completed').length
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length

    const statusMap: Record<string, string> = {
        tentative: 'حجز مبدئي',
        confirmed: 'حجز مؤكد',
        cancelled: 'ملغي',
        completed: 'مكتمل'
    };

    return (
        <div className="space-y-8" dir="rtl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/clients">
                    <GlassButton className="bg-white/5 text-white hover:bg-white/10">
                        <ArrowLeft className="w-4 h-4 me-2 flip-rtl" />
                        العودة للعملاء
                    </GlassButton>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">{client.name}</h1>
                    <p className="text-white/60">ملف العميل والسجل</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile & Stats */}
                <div className="space-y-8">
                    {/* Profile Card */}
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-2xl">
                                <User className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-white">{client.name}</h2>
                                <p className="text-white/40 text-sm">عميل منذ {format(new Date(client.created_at), 'MMM yyyy', { locale: arSA })}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-white/80">
                                <Phone className="w-4 h-4 text-white/40" />
                                <span dir="ltr">{client.phone}</span>
                            </div>
                            {client.email && (
                                <div className="flex items-center gap-3 text-white/80">
                                    <Mail className="w-4 h-4 text-white/40" />
                                    <span>{client.email}</span>
                                </div>
                            )}
                            {client.national_id && (
                                <div className="flex items-center gap-3 text-white/80">
                                    <FileText className="w-4 h-4 text-white/40" />
                                    <span>الهوية: {client.national_id}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <h3 className="text-lg font-semibold text-white mb-4">إحصائيات العميل</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-white/40 text-xs mb-1">إجمالي الحجوزات</p>
                                <p className="text-2xl font-bold text-white">{totalBookings}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-white/40 text-xs mb-1">إجمالي المدفوعات</p>
                                <p className="text-2xl font-bold text-emerald-400">{totalSpent.toLocaleString()}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-white/40 text-xs mb-1">مكتملة</p>
                                <p className="text-2xl font-bold text-blue-400">{completedBookings}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-white/40 text-xs mb-1">ملغاة</p>
                                <p className="text-2xl font-bold text-red-400">{cancelledBookings}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Booking History */}
                <div className="lg:col-span-2">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-400" />
                            سجل الحجوزات
                        </h2>

                        <div className="space-y-4">
                            {bookings.length > 0 ? (
                                bookings.map(booking => (
                                    <Link
                                        href={`/admin/bookings/${booking.id}`}
                                        key={booking.id}
                                        className="block p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-amber-500/20 text-amber-400'
                                                    }`}>
                                                    {booking.status === 'confirmed' ? <CheckCircle className="w-5 h-5" /> :
                                                        booking.status === 'cancelled' ? <XCircle className="w-5 h-5" /> :
                                                            <Clock className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-white font-medium">{booking.hall?.name}</h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
                                                            booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                                                                'bg-amber-500/20 text-amber-400 border-amber-500/20'
                                                            }`}>
                                                            {statusMap[booking.status] || booking.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-1 text-sm text-white/60">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {format(new Date(booking.event_date), 'd MMM yyyy', { locale: arSA })}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <DollarSign className="w-3 h-3" />
                                                            {booking.total_price.toLocaleString()} ر.س
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white/40 flex items-center gap-1">
                                                عرض التفاصيل
                                                <ArrowLeft className="w-4 h-4 flip-rtl" />
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center py-12 text-white/40">
                                    لا توجد حجوزات لهذا العميل.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
