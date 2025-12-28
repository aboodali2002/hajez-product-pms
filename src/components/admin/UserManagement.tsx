'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { createUser } from '@/actions/auth-actions'
import { UserRole } from '@/types'
import toast from 'react-hot-toast'
import { Loader2, Plus, User, Shield } from 'lucide-react'

type UserProfile = {
    id: string
    email: string | null
    role: UserRole
    full_name: string | null
    created_at: string
    hall?: { name: string } | null
}

type Hall = {
    id: string
    name: string
}

export function UserManagement({ users, halls }: { users: UserProfile[]; halls: Hall[] }) {
    const router = useRouter()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        role: 'hall_manager' as UserRole,
        assignedHallId: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await createUser({
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
                role: formData.role,
                assignedHallId: formData.role === 'hall_manager' ? formData.assignedHallId : undefined,
            })

            toast.success('تم إنشاء المستخدم بنجاح')
            setIsModalOpen(false)
            setFormData({
                email: '',
                password: '',
                fullName: '',
                role: 'hall_manager',
                assignedHallId: '',
            })
            router.refresh()
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'فشل إنشاء المستخدم')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">إدارة الفريق</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-semibold hover:bg-white/90 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span>إضافة مستخدم</span>
                </button>
            </div>

            <div className="grid gap-4">
                {users.map((user) => (
                    <div
                        key={user.id}
                        className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                <User className="w-6 h-6 text-white/60" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{user.full_name || 'مستخدم'}</h3>
                                <p className="text-white/40 text-sm">{user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {user.role === 'company_owner' ? (
                                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium border border-purple-500/30 flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    مالك الشركة
                                </span>
                            ) : user.role === 'company_admin' ? (
                                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-medium border border-indigo-500/30">
                                    مدير الشركة
                                </span>
                            ) : user.role === 'platform_admin' ? (
                                <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-sm font-medium border border-red-500/30 flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    مدير المنصة
                                </span>
                            ) : (
                                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium border border-blue-500/30">
                                    {user.hall?.name || 'مدير قاعة'}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="إضافة مستخدم جديد"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">الاسم الكامل</label>
                        <input
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">البريد الإلكتروني</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                            dir="ltr"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">كلمة المرور</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                            dir="ltr"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">الدور</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'hall_manager' })}
                                className={`p-3 rounded-xl border transition-all ${formData.role === 'hall_manager'
                                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                    }`}
                            >
                                مدير قاعة
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'company_admin' })}
                                className={`p-3 rounded-xl border transition-all ${formData.role === 'company_admin'
                                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                    }`}
                            >
                                مدير الشركة
                            </button>
                        </div>
                    </div>

                    {formData.role === 'hall_manager' && (
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-2">القاعة المخصصة</label>
                            <select
                                required
                                value={formData.assignedHallId}
                                onChange={(e) => setFormData({ ...formData, assignedHallId: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 [&>option]:bg-gray-900"
                            >
                                <option value="">اختر القاعة...</option>
                                {halls.map((hall) => (
                                    <option key={hall.id} value={hall.id}>
                                        {hall.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 mt-4 rounded-xl bg-white text-black font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                    </button>
                </form>
            </Modal>
        </div>
    )
}
