import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Building2, CalendarDays, Users, DollarSign, PieChart, Package, Settings } from 'lucide-react'
import { startOfMonth, endOfMonth, format, formatDistanceToNow } from 'date-fns'
import { arSA } from 'date-fns/locale'
import { getCompanyStats } from '@/services/data-service'

async function getStats() {
    const supabase = await createClient()

    // Get current user's company_id from profile
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return {
            halls: 0,
            bookings: 0,
            occupancy: 0,
            recentActivity: [],
            clients: 0
        }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

    const companyId = profile?.company_id

    if (!companyId) {
        console.error('No company_id found for user')
        return {
            halls: 0,
            bookings: 0,
            occupancy: 0,
            recentActivity: [],
            clients: 0
        }
    }

    // Use safe data service with company_id filtering
    const stats = await getCompanyStats(companyId)

    return {
        ...stats,
        clients: 8 // Mock - will be replaced with actual client count
    }
}

export default async function AdminDashboard() {
    const stats = await getStats()

    return (
        <div dir="rtl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">لوحة التحكم</h1>
                <p className="text-white/60">نظرة عامة على أعمال قاعة الأفراح الخاصة بك.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="إجمالي القاعات"
                    value={stats.halls.toString()}
                    icon={Building2}
                    trend="قاعات نشطة"
                />
                <StatCard
                    title="حجوزات نشطة"
                    value={stats.bookings.toString()}
                    icon={CalendarDays}
                    trend="مناسبات قادمة"
                />
                <StatCard
                    title="معدل الإشغال"
                    value={`${stats.occupancy}%`}
                    icon={PieChart}
                    trend="هذا الشهر"
                />
            </div>

            {/* Recent Activity / Quick Actions Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <h2 className="text-xl font-semibold text-white mb-4">النشاط الأخير</h2>
                    <div className="space-y-4">
                        {stats.recentActivity.length > 0 ? (
                            stats.recentActivity.map((activity: any) => (
                                <div key={activity.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <CalendarDays className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">
                                            حجز جديد لـ {activity.hall?.name || 'قاعة غير معروفة'}
                                        </p>
                                        <p className="text-white/40 text-sm">
                                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: arSA })} • {format(new Date(activity.event_date), 'd MMM yyyy', { locale: arSA })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-white/40 text-center py-4">لا يوجد نشاط أخير</div>
                        )}
                    </div>
                </div>

                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <h2 className="text-xl font-semibold text-white mb-4">إجراءات سريعة</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <Link href="/admin/halls" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-start group">
                            <Building2 className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="block text-white font-medium">إضافة قاعة جديدة</span>
                        </Link>
                        <Link href="/admin/calendar" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-start group">
                            <CalendarDays className="w-6 h-6 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="block text-white font-medium">حظر تاريخ</span>
                        </Link>
                        <Link href="/admin/pricing" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-start group">
                            <DollarSign className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="block text-white font-medium">تغيير السعر</span>
                        </Link>
                        <Link href="/admin/packages" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-start group">
                            <Package className="w-6 h-6 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="block text-white font-medium">تعديل الباقات</span>
                        </Link>
                        <Link href="/admin/settings" className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-start group">
                            <Settings className="w-6 h-6 text-zinc-400 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="block text-white font-medium">الإعدادات</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon: Icon, trend }: { title: string, value: string, icon: any, trend: string }) {
    return (
        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-white/60 text-sm font-medium">{title}</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <p className="text-green-400 text-sm font-medium">{trend}</p>
        </div>
    )
}
