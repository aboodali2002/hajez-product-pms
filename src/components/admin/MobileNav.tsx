'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Users, Settings, CheckSquare } from 'lucide-react'

const mobileNavItems = [
    { name: 'الرئيسية', href: '/admin', icon: LayoutDashboard },
    { name: 'التقويم', href: '/admin/calendar', icon: Calendar },
    { name: 'الحجوزات', href: '/admin/bookings', icon: CheckSquare },
    { name: 'العملاء', href: '/admin/clients', icon: Users },
    { name: 'الإعدادات', href: '/admin/settings', icon: Settings },
]

export function MobileNav() {
    const pathname = usePathname()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-lg border-t border-white/10 md:hidden pb-safe">
            <div className="flex justify-around items-center h-16 px-2">
                {mobileNavItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-white' : 'text-white/40'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
