'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Calendar, Users, Settings, LogOut, CheckSquare, DollarSign, Package, Shield } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { LanguageToggle } from '@/components/ui/LanguageToggle'

export function Sidebar() {
    const pathname = usePathname()
    const { signOut } = useAuth()
    const router = useRouter()
    const { t } = useLanguage()

    const navItems = [
        { name: t.nav.dashboard, href: '/admin', icon: LayoutDashboard },
        { name: t.nav.calendar, href: '/admin/calendar', icon: Calendar },
        { name: t.nav.bookings, href: '/admin/bookings', icon: CheckSquare },
        { name: t.nav.payments, href: '/admin/payments', icon: DollarSign },
        { name: t.nav.clients, href: '/admin/clients', icon: Users },
        { name: 'إدارة الفريق', href: '/admin/users', icon: Shield },
        { name: t.nav.halls, href: '/admin/halls', icon: Package },
        { name: t.nav.settings, href: '/admin/settings', icon: Settings },
    ]

    const handleSignOut = async () => {
        await signOut()
        router.push('/login')
    }

    return (
        <aside className="w-64 fixed inset-y-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-s border-white/10 hidden md:block">
            <div className="p-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">قاعات الأفراح</h1>
                    <p className="text-sm text-white/60">لوحة الإدارة</p>
                </div>
                <LanguageToggle />
            </div>

            <nav className="px-4 space-y-2 mt-8">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                ? 'bg-white text-black font-medium shadow-lg shadow-white/10'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            <div className="absolute bottom-8 left-0 right-0 px-4">
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <LogOut className="w-5 h-5 flip-rtl" />
                    {t.nav.logout}
                </button>
            </div>
        </aside>
    )
}
