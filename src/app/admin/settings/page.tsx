import { createClient } from '@/utils/supabase/server'
import { User, Shield } from 'lucide-react'

export default async function SettingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

    return (
        <div dir="rtl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">الإعدادات</h1>
                <p className="text-white/60">إدارة حسابك وتفضيلات النظام.</p>
            </header>

            <div className="max-w-2xl space-y-6">
                {/* Profile Card */}
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <h2 className="text-xl font-semibold text-white mb-6">معلومات الملف الشخصي</h2>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <label className="block text-sm text-white/60 mb-1">البريد الإلكتروني</label>
                                <p className="text-white font-medium">{user?.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <label className="block text-sm text-white/60 mb-1">الدور</label>
                                <p className="text-white font-medium capitalize">
                                    {profile?.role?.replace('_', ' ') || 'مستخدم'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Info */}
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <h2 className="text-xl font-semibold text-white mb-4">معلومات النظام</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-black/20">
                            <p className="text-white/40 text-sm">الإصدار</p>
                            <p className="text-white font-mono">v2.3.0</p>
                        </div>
                        <div className="p-4 rounded-xl bg-black/20">
                            <p className="text-white/40 text-sm">البيئة</p>
                            <p className="text-green-400 font-mono">إنتاج</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
