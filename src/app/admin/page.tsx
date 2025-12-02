import { createClient } from '@/utils/supabase/server'
import { Building2, CalendarDays, Users, DollarSign } from 'lucide-react'

async function getStats() {
    const supabase = await createClient()

    // Fetch counts (mocked for now, or real if tables exist)
    const { count: hallsCount } = await supabase.from('halls').select('*', { count: 'exact', head: true })

    return {
        halls: hallsCount || 0,
        bookings: 12, // Mock
        revenue: 45000, // Mock
        clients: 8 // Mock
    }
}

export default async function AdminDashboard() {
    const stats = await getStats()

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                <p className="text-white/60">Overview of your wedding hall business.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Halls"
                    value={stats.halls.toString()}
                    icon={Building2}
                    trend="+1 this month"
                />
                <StatCard
                    title="Active Bookings"
                    value={stats.bookings.toString()}
                    icon={CalendarDays}
                    trend="+3 this week"
                />
                <StatCard
                    title="Total Clients"
                    value={stats.clients.toString()}
                    icon={Users}
                    trend="+2 new leads"
                />
                <StatCard
                    title="Est. Revenue"
                    value={`$${stats.revenue.toLocaleString()}`}
                    icon={DollarSign}
                    trend="+12% vs last month"
                />
            </div>

            {/* Recent Activity / Quick Actions Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                    <CalendarDays className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">New booking for Grand Ballroom</p>
                                    <p className="text-white/40 text-sm">2 hours ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left group">
                            <Building2 className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="block text-white font-medium">Add New Hall</span>
                        </button>
                        <button className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left group">
                            <CalendarDays className="w-6 h-6 text-green-400 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="block text-white font-medium">Block Date</span>
                        </button>
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
