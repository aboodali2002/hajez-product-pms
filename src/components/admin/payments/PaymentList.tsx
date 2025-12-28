'use client'

import { useState } from 'react'
import { Payment, PaymentMethod } from '@/types'
import { Search, Filter, ChevronRight, Calendar, Building2, User, CreditCard, Banknote, ArrowRightLeft } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { arSA } from 'date-fns/locale'

type PaymentWithDetails = Payment & {
    client_name: string;
    hall_name: string;
    booking_status: string;
}

// ... imports

export function PaymentList({ payments }: { payments: PaymentWithDetails[] }) {
    const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all')
    const [searchTerm, setSearchTerm] = useState('')

    const filteredPayments = payments.filter(payment => {
        const matchesMethod = methodFilter === 'all' || payment.payment_method === methodFilter
        const matchesSearch =
            payment.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.hall_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (payment.reference_no && payment.reference_no.toLowerCase().includes(searchTerm.toLowerCase()))
        return matchesMethod && matchesSearch
    })

    const getMethodIcon = (method: PaymentMethod) => {
        switch (method) {
            case 'cash': return <Banknote className="w-4 h-4" />
            case 'card': return <CreditCard className="w-4 h-4" />
            case 'transfer': return <ArrowRightLeft className="w-4 h-4" />
        }
    }

    const methodMap: Record<string, string> = {
        all: "الكل",
        cash: "نقدي",
        card: "بطاقة",
        transfer: "تحويل"
    };

    const typeMap: Record<string, string> = {
        deposit: "عربون",
        remaining: "المتبقي",
        full_payment: "دفع كامل",
        service_addon: "خدمة إضافية"
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                    {(['all', 'cash', 'transfer', 'card'] as const).map((method) => (
                        <button
                            key={method}
                            onClick={() => setMethodFilter(method)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${methodFilter === method
                                ? 'bg-white text-black shadow-lg'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {methodMap[method]}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        type="text"
                        placeholder="بحث في المدفوعات..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pe-10 ps-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30"
                    />
                </div>
            </div>

            {/* Table */}
            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-4">
                {filteredPayments.map((payment) => (
                    <div
                        key={payment.id}
                        onClick={() => window.location.href = `/admin/bookings/${payment.booking_id}`}
                        className="block bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm active:scale-[0.98] transition-all"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{payment.client_name}</h3>
                                    <div className="flex items-center gap-1 text-xs text-white/60 mt-0.5">
                                        <Building2 className="w-3 h-3" />
                                        {payment.hall_name}
                                    </div>
                                </div>
                            </div>
                            <div className="text-end">
                                <span className="text-emerald-400 font-mono font-medium block">
                                    +{payment.amount.toLocaleString()}
                                </span>
                                <span className="text-xs text-white/40">ر.س</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-sm border-t border-white/5 pt-3">
                            <div className="flex items-center gap-2 text-white/80">
                                {getMethodIcon(payment.payment_method)}
                                <span className="capitalize">{methodMap[payment.payment_method] || payment.payment_method}</span>
                            </div>
                            <div className="text-white/40 text-xs">
                                {format(new Date(payment.payment_date), 'd MMM yyyy', { locale: arSA })}
                            </div>
                        </div>
                    </div>
                ))}
                {filteredPayments.length === 0 && (
                    <div className="text-center py-12 text-white/40">
                        لم يتم العثور على مدفوعات تطابق بحثك.
                    </div>
                )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-start">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="p-4 text-sm font-medium text-white/60">التاريخ</th>
                                <th className="p-4 text-sm font-medium text-white/60">العميل / الحجز</th>
                                <th className="p-4 text-sm font-medium text-white/60">القاعة</th>
                                <th className="p-4 text-sm font-medium text-white/60">المبلغ</th>
                                <th className="p-4 text-sm font-medium text-white/60">الطريقة</th>
                                <th className="p-4 text-sm font-medium text-white/60">النوع</th>
                                <th className="p-4 text-sm font-medium text-white/60">المرجع</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredPayments.map((payment) => (
                                <tr
                                    key={payment.id}
                                    className="group hover:bg-white/5 transition-colors cursor-pointer"
                                    onClick={() => window.location.href = `/admin/bookings/${payment.booking_id}`}
                                >
                                    <td className="p-4 text-white/80 text-sm">
                                        {format(new Date(payment.payment_date), 'd MMM yyyy', { locale: arSA })}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white text-sm">{payment.client_name}</p>
                                                <p className="text-xs text-white/40">#{payment.booking_id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-white/80 text-sm">
                                            <Building2 className="w-4 h-4 text-white/40" />
                                            {payment.hall_name}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-emerald-400 font-mono font-medium">
                                            +{payment.amount.toLocaleString()} ر.س
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-white/80 text-sm capitalize">
                                            {getMethodIcon(payment.payment_method)}
                                            {methodMap[payment.payment_method] || payment.payment_method}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded-md bg-white/5 text-white/60 text-xs capitalize border border-white/5">
                                            {typeMap[payment.payment_type] || payment.payment_type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-white/40 text-sm font-mono">
                                        {payment.reference_no || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredPayments.length === 0 && (
                    <div className="text-center py-12 text-white/40">
                        لم يتم العثور على مدفوعات تطابق بحثك.
                    </div>
                )}
            </div>
        </div>
    )
}
