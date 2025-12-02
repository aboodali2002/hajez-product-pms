'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Building2, CalendarDays, Settings, LogOut, Package } from 'lucide-react'

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Halls', href: '/admin/halls', icon: Building2 },
    { name: 'Packages', href: '/admin/packages', icon: Package },
    { name: 'Calendar', href: '/admin/calendar', icon: CalendarDays },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="w-64 h-screen fixed left-0 top-0 flex flex-col bg-black/40 backdrop-blur-xl border-r border-white/5">
            <div className="p-8">
                <h1 className="text-xl font-bold text-white">Mahdi Admin</h1>
                <p className="text-xs text-white/40 mt-1">Wedding Hall Management</p>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                ? 'bg-white text-black font-medium'
                                : 'text-white/60 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-white/5">
                <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-all">
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </div>
    )
}
