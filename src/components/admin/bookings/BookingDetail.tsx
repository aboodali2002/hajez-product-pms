'use client'

import { useState } from 'react'
import { Booking, BookingService, Payment, HallService, Client, Hall } from '@/types'
import {
    updateClientNationalIdAction,
    addBookingServiceAction,
    removeBookingServiceAction,
    recordPaymentAction,
    confirmBookingAction,
    cancelBookingAction,
    updateBookingDepositPercentageAction
} from '@/app/admin/bookings/actions'
import {
    User, Phone, FileText, Calendar, Building2,
    Plus, Trash2, DollarSign, CheckCircle, XCircle, Printer
} from 'lucide-react'
import { GlassButton } from '@/components/ui/GlassButton'
import { Modal } from '@/components/ui/Modal'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

type BookingDetailProps = {
    booking: Booking & { client: Client, hall: Hall };
    services: BookingService[];
    payments: Payment[];
    availableServices: HallService[];
}


import { arSA } from "date-fns/locale";

// ... previous imports

export function BookingDetail({ booking, services, payments, availableServices }: BookingDetailProps) {
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)

    // Loading States
    const [isUpdatingId, setIsUpdatingId] = useState(false)
    const [isAddingService, setIsAddingService] = useState(false)
    const [isRecordingPayment, setIsRecordingPayment] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)

    // National ID State
    const [nationalId, setNationalId] = useState(booking.client?.national_id || '')

    // Service Modal State
    const [selectedServiceId, setSelectedServiceId] = useState('')

    // Payment Modal State
    const [paymentAmount, setPaymentAmount] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('transfer')
    const [paymentType, setPaymentType] = useState('deposit')
    const [paymentRef, setPaymentRef] = useState('')
    const [paymentNotes, setPaymentNotes] = useState('')

    // Cancel Modal State
    const [cancelReason, setCancelReason] = useState('')

    // Contract Terms State
    const [isEditingDeposit, setIsEditingDeposit] = useState(false)
    const [depositPercentage, setDepositPercentage] = useState((booking.deposit_percentage || 0.30) * 100)

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const remaining = booking.total_price - totalPaid

    const handleUpdateNationalId = async () => {
        if (!booking.client_id) return
        setIsUpdatingId(true)
        try {
            await updateClientNationalIdAction(booking.client_id, nationalId)
            toast.success('تم تحديث الهوية الوطنية بنجاح')
        } catch (e) {
            toast.error('فشل تحديث الهوية الوطنية')
        } finally {
            setIsUpdatingId(false)
        }
    }

    const handleUpdateDeposit = async () => {
        try {
            await updateBookingDepositPercentageAction(booking.id, depositPercentage / 100)
            setIsEditingDeposit(false)
            toast.success('تم تحديث نسبة العربون')
        } catch (e) {
            toast.error('فشل تحديث نسبة العربون')
        }
    }

    const handleAddService = async () => {
        if (!selectedServiceId) return
        const service = availableServices.find(s => s.id === selectedServiceId)
        if (!service) return

        setIsAddingService(true)
        try {
            await addBookingServiceAction(booking.id, service.service?.name || 'Unknown Service', service.price)
            setIsServiceModalOpen(false)
            setSelectedServiceId('')
            toast.success('تم إضافة الخدمة بنجاح')
        } catch (e) {
            toast.error('فشل إضافة الخدمة')
        } finally {
            setIsAddingService(false)
        }
    }

    const handleRemoveService = async (id: string, price: number) => {
        if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟ لا يمكن التراجع عن هذا الإجراء.')) return

        try {
            await removeBookingServiceAction(id, booking.id, price)
            toast.success('تم حذف الخدمة')
        } catch (e) {
            toast.error('فشل حذف الخدمة')
        }
    }

    const openPaymentModal = () => {
        const requiredDeposit = booking.total_price * (booking.deposit_percentage || 0.30)
        const isDepositMet = totalPaid >= requiredDeposit

        // Smart Defaults
        let defaultType = 'deposit'
        let defaultAmount = 0

        if (isDepositMet) {
            defaultType = 'remaining'
            defaultAmount = remaining
        } else {
            defaultType = 'deposit'
            defaultAmount = Math.max(0, requiredDeposit - totalPaid)
        }

        setPaymentType(defaultType)
        setPaymentAmount(defaultAmount > 0 ? defaultAmount.toString() : '')
        setIsPaymentModalOpen(true)
    }

    const handleRecordPayment = async () => {
        const formData = new FormData()
        formData.append('booking_id', booking.id)
        formData.append('amount', paymentAmount)
        formData.append('payment_method', paymentMethod)
        formData.append('payment_type', paymentType)
        formData.append('reference_no', paymentRef)
        formData.append('notes', paymentNotes)

        setIsRecordingPayment(true)
        try {
            // @ts-ignore - The action returns a result now
            const result = await recordPaymentAction(formData)
            setIsPaymentModalOpen(false)
            setPaymentAmount('')
            setPaymentRef('')
            setPaymentNotes('')

            if (result && result.warning) {
                toast(result.warning, { icon: '⚠️', duration: 5000 })
            } else {
                toast.success('تم تسجيل الدفعة بنجاح')
            }
        } catch (e: any) {
            toast.error(e.message || 'فشل تسجيل الدفعة')
        } finally {
            setIsRecordingPayment(false)
        }
    }

    const handleConfirmBooking = async () => {
        if (!confirm('هل أنت متأكد من تأكيد هذا الحجز؟')) return

        setIsConfirming(true)
        try {
            await confirmBookingAction(booking.id)
            toast.success('تم تأكيد الحجز بنجاح')
        } catch (e) {
            toast.error('فشل تأكيد الحجز')
        } finally {
            setIsConfirming(false)
        }
    }

    const handleCancelBooking = async () => {
        setIsCancelling(true)
        try {
            await cancelBookingAction(booking.id, cancelReason)
            setIsCancelModalOpen(false)
            toast.success('تم إلغاء الحجز')
        } catch (e) {
            toast.error('فشل إلغاء الحجز')
        } finally {
            setIsCancelling(false)
        }
    }

    const statusMap: Record<string, string> = {
        tentative: 'حجز مبدئي',
        confirmed: 'حجز مؤكد',
        cancelled: 'ملغي',
        completed: 'مكتمل'
    };

    const financialStatusMap: Record<string, string> = {
        unpaid: 'غير مدفوع',
        partially_paid: 'مدفوع جزئياً',
        fully_paid: 'مدفوع بالكامل',
        overpaid: 'مدفوع بزيادة'
    };

    return (
        <div className="space-y-8" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-white">حجز رقم #{booking.id.slice(0, 8)}</h1>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
                            booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                                'bg-amber-500/20 text-amber-400 border-amber-500/20'
                            }`}>
                            {statusMap[booking.status] || booking.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${booking.financial_status === 'fully_paid' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
                            booking.financial_status === 'partially_paid' ? 'bg-orange-500/20 text-orange-400 border-orange-500/20' :
                                booking.financial_status === 'overpaid' ? 'bg-purple-500/20 text-purple-400 border-purple-500/20' :
                                    'bg-red-500/20 text-red-400 border-red-500/20'
                            }`}>
                            {booking.financial_status ? (financialStatusMap[booking.financial_status] || booking.financial_status) : 'غير مدفوع'}
                        </span>
                    </div>
                    <div className="flex gap-4 text-white/60">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(booking.event_date), 'd MMMM yyyy', { locale: arSA })}
                        </div>
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {booking.hall?.name}
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    {booking.status === 'tentative' && (
                        <>
                            <GlassButton
                                onClick={() => setIsCancelModalOpen(true)}
                                disabled={isCancelling}
                                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20"
                            >
                                <XCircle className="w-4 h-4 me-2" />
                                إلغاء
                            </GlassButton>
                            <GlassButton
                                onClick={handleConfirmBooking}
                                disabled={isConfirming}
                                className={`bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20 ${isConfirming ? 'opacity-50' : ''}`}
                            >
                                <CheckCircle className="w-4 h-4 me-2" />
                                {isConfirming ? 'جاري التأكيد...' : 'تأكيد'}
                            </GlassButton>
                        </>
                    )}
                    <GlassButton className="bg-white/5 text-white hover:bg-white/10">
                        <Printer className="w-4 h-4 me-2" />
                        طباعة العقد
                    </GlassButton>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Client & Services */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Section A: Client Details */}
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-purple-400" />
                            تفاصيل العميل
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm text-white/40 mb-1">الاسم الكامل</label>
                                <p className="text-white font-medium text-lg">{booking.client?.name}</p>
                            </div>
                            <div>
                                <label className="block text-sm text-white/40 mb-1">رقم الهاتف</label>
                                <div className="flex items-center gap-2 text-white font-medium text-lg" dir="ltr">
                                    <Phone className="w-4 h-4 text-white/40" />
                                    {booking.client?.phone}
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm text-white/40 mb-1">الهوية الوطنية (مطلوبة للعقد)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={nationalId}
                                        onChange={(e) => setNationalId(e.target.value)}
                                        placeholder="أدخل الهوية الوطنية"
                                        className="flex-1 px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-white/30"
                                    />
                                    <button
                                        onClick={handleUpdateNationalId}
                                        disabled={isUpdatingId}
                                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 transition-colors"
                                    >
                                        حفظ
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Contract Terms */}
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-amber-400" />
                                شروط العقد
                            </h2>
                            {!isEditingDeposit && (
                                <button
                                    onClick={() => setIsEditingDeposit(true)}
                                    className="text-sm text-amber-400 hover:text-amber-300"
                                >
                                    تعديل
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm text-white/40 mb-1">نسبة العربون المطلوبة</label>
                                {isEditingDeposit ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={depositPercentage}
                                            onChange={(e) => setDepositPercentage(Number(e.target.value))}
                                            className="w-20 px-3 py-1 rounded-lg bg-black/20 border border-white/10 text-white focus:outline-none"
                                        />
                                        <button onClick={handleUpdateDeposit} className="text-green-400 hover:text-green-300">حفظ</button>
                                        <button onClick={() => setIsEditingDeposit(false)} className="text-white/40 hover:text-white">إلغاء</button>
                                    </div>
                                ) : (
                                    <p className="text-white font-medium text-lg">{booking.deposit_percentage ? booking.deposit_percentage * 100 : 30}%</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm text-white/40 mb-1">المبلغ المطلوب</label>
                                <p className="text-white font-medium text-lg">
                                    {(booking.total_price * (booking.deposit_percentage || 0.30)).toLocaleString()} ر.س
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section B: Services */}
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <Plus className="w-5 h-5 text-blue-400" />
                                الخدمات والباقات
                            </h2>
                            <button
                                onClick={() => setIsServiceModalOpen(true)}
                                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" /> إضافة خدمة
                            </button>
                        </div>

                        <div className="space-y-3">
                            {services.length > 0 ? (
                                services.map(service => (
                                    <div key={service.id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                        <div>
                                            <p className="text-white font-medium">{service.service_name}</p>
                                            <p className="text-sm text-white/40">الكمية: {service.quantity}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-white font-mono">{service.price.toLocaleString()} ر.س</span>
                                            <button
                                                onClick={() => handleRemoveService(service.id, service.price)}
                                                className="text-red-400 hover:text-red-300 p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-white/40 text-center py-4">لا توجد خدمات إضافية.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Finance */}
                <div className="space-y-8">
                    {/* Section C: Payments */}
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-400" />
                            ملخص الدفع
                        </h2>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center">
                                <span className="text-white/60">إجمالي العقد</span>
                                <span className="text-2xl font-bold text-white">{booking.total_price.toLocaleString()} <span className="text-sm text-white/40">ر.س</span></span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white/60">المبلغ المدفوع</span>
                                <span className="text-xl font-medium text-green-400">{totalPaid.toLocaleString()} <span className="text-sm text-green-400/60">ر.س</span></span>
                            </div>
                            <div className="h-px bg-white/10 my-2" />
                            <div className="flex justify-between items-center">
                                <span className="text-white/60">المتبقي</span>
                                <span className="text-xl font-bold text-red-400">{remaining.toLocaleString()} <span className="text-sm text-red-400/60">ر.س</span></span>
                            </div>
                        </div>

                        <GlassButton onClick={openPaymentModal} className="w-full justify-center bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/30 mb-6">
                            <Plus className="w-4 h-4 me-2" />
                            تسجيل دفعة
                        </GlassButton>

                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">سجل المدفوعات</h3>
                            {payments.length > 0 ? (
                                payments.map(payment => (
                                    <div key={payment.id} className="p-3 rounded-xl bg-white/5 border border-white/5 text-sm">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-white font-medium">
                                                {payment.payment_type === 'deposit' ? 'عربون' :
                                                    payment.payment_type === 'remaining' ? 'المتبقي' :
                                                        payment.payment_type === 'full_payment' ? 'دفع كامل' : payment.payment_type}
                                            </span>
                                            <span className="text-green-400 font-mono">{payment.amount.toLocaleString()} ر.س</span>
                                        </div>
                                        <div className="flex justify-between text-white/40 text-xs">
                                            <span>{format(new Date(payment.payment_date), 'd MMM yyyy', { locale: arSA })}</span>
                                            <span className="capitalize">
                                                {payment.payment_method === 'cash' ? 'نقدي' :
                                                    payment.payment_method === 'transfer' ? 'تحويل' :
                                                        payment.payment_method === 'card' ? 'بطاقة' : payment.payment_method}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-white/40 text-center text-sm py-2">لا توجد مدفوعات مسجلة.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Service Modal */}
            <Modal isOpen={isServiceModalOpen} onClose={() => setIsServiceModalOpen(false)} title="إضافة خدمة">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-white/60 mb-1">اختر الخدمة</label>
                        <select
                            value={selectedServiceId}
                            onChange={(e) => setSelectedServiceId(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 [&>option]:bg-zinc-900"
                        >
                            <option value="">اختر خدمة...</option>
                            {availableServices.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.service?.name} - {s.price} ر.س
                                </option>
                            ))}
                        </select>
                    </div>
                    <GlassButton
                        onClick={handleAddService}
                        disabled={isAddingService}
                        className={`w-full justify-center bg-white text-black hover:bg-white/90 ${isAddingService ? 'opacity-50' : ''}`}
                    >
                        {isAddingService ? 'جاري الإضافة...' : 'إضافة خدمة'}
                    </GlassButton>
                </div>
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="تسجيل دفعة">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-white/60 mb-1">المبلغ (ر.س)</label>
                        <input
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30"
                        />
                    </div>

                    {paymentType === 'deposit' && (
                        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm">
                            <p className="text-blue-300 mb-1">
                                المبلغ المستهدف للتأكيد: <span className="font-bold">{(booking.total_price * (booking.deposit_percentage || 0.30)).toLocaleString()} ر.س</span>
                            </p>
                            <p className="text-white/60 text-xs">
                                (المتبقي للعربون: <span className="text-white">{Math.max(0, (booking.total_price * (booking.deposit_percentage || 0.30)) - totalPaid).toLocaleString()} ر.س</span>)
                            </p>
                            {booking.status === 'tentative' && Number(paymentAmount) + totalPaid < (booking.total_price * (booking.deposit_percentage || 0.30)) && Number(paymentAmount) > 0 && (
                                <p className="text-orange-400 mt-2 flex items-start gap-2">
                                    <span className="mt-0.5">⚠️</span>
                                    هذا المبلغ غير كافٍ لتأكيد الحجز تلقائيًا.
                                </p>
                            )}
                        </div>
                    )}

                    {(paymentType === 'remaining' || paymentType === 'full_payment') && (
                        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-sm">
                            <p className="text-purple-300">
                                الرصيد المتبقي: <span className="font-bold">{remaining.toLocaleString()} ر.س</span>
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-white/60 mb-1">النوع</label>
                            <select
                                value={paymentType}
                                onChange={(e) => setPaymentType(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 [&>option]:bg-zinc-900"
                            >
                                <option value="deposit">عربون</option>
                                <option value="full_payment">دفع كامل</option>
                                <option value="remaining">المتبقي</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1">الطريقة</label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 [&>option]:bg-zinc-900"
                            >
                                <option value="cash">نقدي</option>
                                <option value="transfer">تحويل</option>
                                <option value="card">بطاقة</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-white/60 mb-1">رقم المرجع (اختياري)</label>
                        <input
                            type="text"
                            value={paymentRef}
                            onChange={(e) => setPaymentRef(e.target.value)}
                            placeholder="مثلاً: رقم الحوالة"
                            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-white/60 mb-1">ملاحظات (اختياري)</label>
                        <textarea
                            value={paymentNotes}
                            onChange={(e) => setPaymentNotes(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 resize-none"
                            rows={2}
                        />
                    </div>
                    <GlassButton
                        onClick={handleRecordPayment}
                        disabled={isRecordingPayment}
                        className={`w-full justify-center bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/30 ${isRecordingPayment ? 'opacity-50' : ''}`}
                    >
                        {isRecordingPayment ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
                    </GlassButton>
                </div>
            </Modal>

            {/* Cancel Modal */}
            <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} title="إلغاء الحجز">
                <div className="space-y-4">
                    <p className="text-white/80">هل أنت متأكد أنك تريد إلغاء هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.</p>
                    <div>
                        <label className="block text-sm text-white/60 mb-1">سبب الإلغاء</label>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            required
                            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 resize-none"
                            rows={3}
                        />
                    </div>
                    <GlassButton
                        onClick={handleCancelBooking}
                        disabled={isCancelling || !cancelReason.trim()}
                        className={`w-full justify-center bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30 ${isCancelling ? 'opacity-50' : ''}`}
                    >
                        {isCancelling ? 'جاري الإلغاء...' : 'تأكيد الإلغاء'}
                    </GlassButton>
                </div>
            </Modal>
        </div>
    )
}
