'use client'

import { GlassButton } from "@/components/ui/GlassButton"
import { ShieldAlert } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"

export default function UnauthorizedPage() {
    const { profile } = useAuth()

    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-red-900/20 blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-900/20 blur-[100px] animate-pulse delay-700" />

            <div className="w-full max-w-md p-8 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl relative z-10 mx-4 text-center">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                        <ShieldAlert className="w-10 h-10 text-red-400" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-white mb-4">
                    غير مصرح لك
                </h1>

                <p className="text-white/60 mb-2">
                    عذراً، ليس لديك صلاحية للوصول إلى هذه الصفحة
                </p>

                {profile && (
                    <p className="text-white/40 text-sm mb-8">
                        دورك الحالي: <span className="text-purple-400">{profile.role}</span>
                    </p>
                )}

                <div className="space-y-3">
                    <Link href="/admin" className="block">
                        <GlassButton className="w-full">
                            العودة للوحة التحكم
                        </GlassButton>
                    </Link>

                    <Link href="/login" className="block">
                        <GlassButton variant="secondary" className="w-full">
                            تسجيل الدخول بحساب آخر
                        </GlassButton>
                    </Link>
                </div>
            </div>
        </div>
    )
}
