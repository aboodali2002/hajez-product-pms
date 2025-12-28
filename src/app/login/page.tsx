'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()
    const { user, profile, isLoading: isAuthLoading } = useAuth()
    const [loading, setLoading] = useState(false)
    const [showDebug, setShowDebug] = useState(false)
    const [mode, setMode] = useState<'login' | 'signup'>('login')
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        companyName: '',
    })

    // Show error from URL params
    useEffect(() => {
        const error = searchParams.get('error')
        if (error) {
            toast.error(decodeURIComponent(error))
        }
    }, [searchParams])

    // Watchdog Timer for infinite loading
    useEffect(() => {
        let debugTimer: NodeJS.Timeout | undefined
        let safetyTimer: NodeJS.Timeout | undefined

        if (loading) {
            // Show debug info after 3 seconds if still loading
            debugTimer = setTimeout(() => {
                setShowDebug(true)
            }, 3000)

            // Force stop loading after 10 seconds
            safetyTimer = setTimeout(() => {
                setLoading(false)
                toast.error('Request timed out. Check debug info below.')
                setShowDebug(true)
            }, 10000)
        } else {
            setShowDebug(false)
        }

        return () => {
            if (debugTimer) clearTimeout(debugTimer)
            if (safetyTimer) clearTimeout(safetyTimer)
        }
    }, [loading])

    // Reactive redirect logic
    useEffect(() => {
        const handleRedirect = async () => {
            // Only redirect if we have both user AND profile
            if (!isAuthLoading && user && profile) {
                console.log('Login Redirect: Checking role...', profile.role)

                // Platform Admin → Platform dashboard
                if (profile.role === 'platform_admin') {
                    router.replace('/platform/admin')
                }
                // Company Owner or Company Admin → Company dashboard
                else if (profile.role === 'company_owner' || profile.role === 'company_admin') {
                    // Get company slug
                    if (profile.company_id) {
                        const { data: companyData } = await supabase
                            .from('companies')
                            .select('slug')
                            .eq('id', profile.company_id)
                            .single()

                        if (companyData?.slug) {
                            // TODO: Update to /app/[company_slug]/dashboard when routing is ready
                            // For now, redirect to /admin (will update in Phase 5)
                            router.replace('/admin')
                        } else {
                            toast.error('Company not found')
                            setLoading(false)
                        }
                    } else {
                        toast.error('No company assigned')
                        setLoading(false)
                    }
                }
                // Hall Manager → Hall dashboard
                else if (profile.role === 'hall_manager') {
                    if (profile.assigned_hall_id) {
                        // Fetch hall slug
                        const { data } = await supabase
                            .from('halls')
                            .select('slug')
                            .eq('id', profile.assigned_hall_id)
                            .single()

                        if (data?.slug) {
                            router.replace(`/hall/${data.slug}/dashboard`)
                        } else {
                            toast.error('Could not find assigned hall')
                            setLoading(false)
                        }
                    } else {
                        toast.error('No hall assigned to this manager')
                        setLoading(false)
                    }
                } else {
                    // Unknown role
                    toast.error('Invalid user role')
                    setLoading(false)
                }
            }
            // If user exists but no profile, just wait - AuthContext is loading it
            // Don't show error or stop loading - let it resolve naturally

            // EMERGENCY FALLBACK: If user is authenticated but profile is stuck, force entry
            if (!isAuthLoading && user && !profile) {
                console.warn('Emergency Redirect: User authenticated but profile missing. Forcing /admin access.');
                toast.success('Login forced (Profile pending)');
                router.replace('/admin');
            }
        }

        handleRedirect()
    }, [user, profile, isAuthLoading, router, supabase])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            })

            if (error) {
                toast.error(error.message)
                setLoading(false)
            } else {
                toast.success('Authenticating...')
                // We leave loading=true while the effect picks up the new user state and redirects
            }
        } catch (error) {
            console.error(error)
            toast.error('Unexpected error')
            setLoading(false)
        }
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Validation
            if (!formData.fullName || !formData.companyName) {
                toast.error('Please fill in all fields')
                setLoading(false)
                return
            }

            // Call server action directly
            const formDataObj = new FormData()
            formDataObj.append('email', formData.email)
            formDataObj.append('password', formData.password)
            formDataObj.append('fullName', formData.fullName)
            formDataObj.append('companyName', formData.companyName)

            // Import and call the signup action
            const { signup } = await import('./actions')

            try {
                await signup(formDataObj)
                // If successful, redirect will happen automatically
                toast.success('Account created! Redirecting...')
            } catch (error: any) {
                // Handle redirect errors (which are actually success)
                if (error?.message?.includes('NEXT_REDIRECT')) {
                    toast.success('Account created! Redirecting...')
                } else {
                    throw error
                }
            }
        } catch (error: any) {
            console.error('Signup error:', error)
            toast.error(error?.message || 'Signup failed')
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setLoading(false)
        window.location.reload()
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/20 blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[100px] animate-pulse delay-700" />

            <div className="w-full max-w-md p-8 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl relative z-10 mx-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                        {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
                    </h1>
                    <p className="text-white/40 mt-2">
                        {mode === 'login' ? 'قم بتسجيل الدخول لإدارة القاعات' : 'ابدأ رحلتك معنا'}
                    </p>
                </div>

                {/* Mode Toggle */}
                <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setMode('login')}
                        className={`flex-1 py-2 px-4 rounded-lg transition-all ${mode === 'login'
                            ? 'bg-white text-black font-semibold'
                            : 'text-white/60 hover:text-white'
                            }`}
                    >
                        تسجيل الدخول
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('signup')}
                        className={`flex-1 py-2 px-4 rounded-lg transition-all ${mode === 'signup'
                            ? 'bg-white text-black font-semibold'
                            : 'text-white/60 hover:text-white'
                            }`}
                    >
                        حساب جديد
                    </button>
                </div>

                <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
                    {mode === 'signup' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2 text-right">
                                    الاسم الكامل
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-right"
                                    placeholder="أحمد محمد"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2 text-right">
                                    اسم الشركة
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-right"
                                    placeholder="قاعات الفخامة"
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2 text-right">
                            البريد الإلكتروني
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-right dir-rtl"
                            placeholder="name@example.com"
                            dir="ltr"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2 text-right">
                            كلمة المرور
                        </label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                            placeholder="••••••••"
                            dir="ltr"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || isAuthLoading}
                        className="w-full py-3 px-4 rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-6"
                    >
                        {(loading || isAuthLoading) && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading || isAuthLoading
                            ? (mode === 'login' ? 'جاري الدخول...' : 'جاري الإنشاء...')
                            : (mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب')
                        }
                    </button>
                </form>

                {/* Emergency Logout */}
                <div className="mt-4 text-center">
                    <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 underline">
                        Force Logout / Reset
                    </button>
                </div>
            </div>

            {/* Debug Overlay */}
            {showDebug && (
                <div className="fixed bottom-0 left-0 w-full bg-black/90 text-white p-4 font-mono text-xs z-50 border-t border-white/20">
                    <p><strong>DEBUG INFO:</strong></p>
                    <p>App Loading (isAuthLoading): {String(isAuthLoading)}</p>
                    <p>Local Loading: {String(loading)}</p>
                    <p>User ID: {user?.id || 'null'}</p>
                    <p>Profile Role: {profile?.role || 'null'}</p>
                </div>
            )}
        </div>
    )
}
