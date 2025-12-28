import { DollarSign, TrendingUp, Calendar, CreditCard } from 'lucide-react'

type PaymentStatsProps = {
    totalRevenue: number;
    monthlyRevenue: number;
    transactionCount: number;
    avgTransaction: number;
}

export function PaymentStats({ totalRevenue, monthlyRevenue, transactionCount, avgTransaction }: PaymentStatsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" dir="rtl">
            <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2 text-emerald-400">
                    <div className="p-2 rounded-xl bg-emerald-500/20">
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <span className="font-medium">إجمالي الإيرادات</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                    {totalRevenue.toLocaleString()} <span className="text-lg text-white/40 font-normal">ر.س</span>
                </div>
                <p className="text-sm text-emerald-400/60">الدخل الكلي</p>
            </div>

            <div className="p-6 rounded-3xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2 text-blue-400">
                    <div className="p-2 rounded-xl bg-blue-500/20">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <span className="font-medium">هذا الشهر</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                    {monthlyRevenue.toLocaleString()} <span className="text-lg text-white/40 font-normal">ر.س</span>
                </div>
                <p className="text-sm text-blue-400/60">إيرادات الشهر الحالي</p>
            </div>

            <div className="p-6 rounded-3xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2 text-purple-400">
                    <div className="p-2 rounded-xl bg-purple-500/20">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="font-medium">متوسط العملية</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                    {Math.round(avgTransaction).toLocaleString()} <span className="text-lg text-white/40 font-normal">ر.س</span>
                </div>
                <p className="text-sm text-purple-400/60">لكل دفعة</p>
            </div>

            <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2 text-amber-400">
                    <div className="p-2 rounded-xl bg-amber-500/20">
                        <CreditCard className="w-5 h-5" />
                    </div>
                    <span className="font-medium">المعاملات</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                    {transactionCount}
                </div>
                <p className="text-sm text-amber-400/60">إجمالي المدفوعات المسجلة</p>
            </div>
        </div>
    )
}
