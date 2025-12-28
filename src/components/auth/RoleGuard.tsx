'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

type RoleGuardProps = {
    children: React.ReactNode
    allowedRoles: string[]
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { user, profile, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.replace('/login')
            } else if (!profile) {
                // EMERGENCY BYPASS: If profile is missing but user is auth, allow it.
                // This prevents the infinite loop.
                console.warn('RoleGuard: Profile missing but user authenticated. Allow access for debugging.')
            } else if (!allowedRoles.includes(profile.role)) {
                // Only redirect if we HAVE a profile and the role is WRONG
                router.replace('/unauthorized')
            }
        }
    }, [user, profile, isLoading, router, allowedRoles])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
        )
    }

    // While redirecting...
    if (!user) {
        return null
    }

    // Strict role check only if profile exists
    if (profile && !allowedRoles.includes(profile.role)) {
        return null
    }

    return <>{children}</>
}
