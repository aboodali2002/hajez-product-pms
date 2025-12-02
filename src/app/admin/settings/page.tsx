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
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                <p className="text-white/60">Manage your account and system preferences.</p>
            </header>

            <div className="max-w-2xl space-y-6">
                {/* Profile Card */}
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <label className="block text-sm text-white/60 mb-1">Email Address</label>
                                <p className="text-white font-medium">{user?.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <label className="block text-sm text-white/60 mb-1">Role</label>
                                <p className="text-white font-medium capitalize">
                                    {profile?.role?.replace('_', ' ') || 'User'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Info */}
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <h2 className="text-xl font-semibold text-white mb-4">System Information</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-black/20">
                            <p className="text-white/40 text-sm">Version</p>
                            <p className="text-white font-mono">v2.3.0</p>
                        </div>
                        <div className="p-4 rounded-xl bg-black/20">
                            <p className="text-white/40 text-sm">Environment</p>
                            <p className="text-green-400 font-mono">Production</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
