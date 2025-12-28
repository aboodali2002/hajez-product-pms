'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Discount, Hall } from '@/types'
import { Plus, Trash2, Edit2 } from 'lucide-react'

// ... imports

export function DiscountsTab({ halls }: { halls: Hall[] }) {
    const [discounts, setDiscounts] = useState<Discount[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedHall, setSelectedHall] = useState<string>(halls[0]?.id || '')
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Form State
    const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)
    const [formData, setFormData] = useState<Partial<Discount>>({
        name: '',
        type: 'percent',
        value: 0,
        min_advance_booking_days: 0,
        active: true
    })

    const supabase = createClient()

    useEffect(() => {
        if (selectedHall) fetchDiscounts()
    }, [selectedHall])

    async function fetchDiscounts() {
        setLoading(true)
        const { data, error } = await supabase
            .from('discounts')
            .select('*')
            .eq('hall_id', selectedHall)

        if (error) console.error(error)
        else setDiscounts(data as Discount[])
        setLoading(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedHall) return

        const payload = {
            ...formData,
            hall_id: selectedHall
        }

        if (editingDiscount) {
            const { error } = await supabase
                .from('discounts')
                .update(payload)
                .eq('id', editingDiscount.id)
            if (!error) {
                setIsModalOpen(false)
                setEditingDiscount(null)
                fetchDiscounts()
            }
        } else {
            const { error } = await supabase
                .from('discounts')
                .insert(payload)
            if (!error) {
                setIsModalOpen(false)
                fetchDiscounts()
            }
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('هل أنت متأكد؟')) return
        const { error } = await supabase.from('discounts').delete().eq('id', id)
        if (!error) fetchDiscounts()
    }

    async function toggleActive(discount: Discount) {
        const { error } = await supabase
            .from('discounts')
            .update({ active: !discount.active })
            .eq('id', discount.id)
        if (!error) fetchDiscounts()
    }

    function openModal(discount?: Discount) {
        if (discount) {
            setEditingDiscount(discount)
            setFormData(discount)
        } else {
            setEditingDiscount(null)
            setFormData({
                name: '',
                type: 'percent',
                value: 0,
                min_advance_booking_days: 0,
                active: true
            })
        }
        setIsModalOpen(true)
    }

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <select
                    value={selectedHall}
                    onChange={(e) => setSelectedHall(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                >
                    {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg hover:bg-white/90"
                >
                    <Plus className="w-4 h-4" /> إضافة خصم
                </button>
            </div>

            <div className="grid gap-4">
                {discounts.map(discount => (
                    <div key={discount.id} className={`bg-white/5 border ${discount.active ? 'border-white/10' : 'border-red-500/20 opacity-60'} rounded-xl p-4 flex justify-between items-center`}>
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-white">{discount.name}</h3>
                                {!discount.active && <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-full">غير مفعل</span>}
                            </div>
                            <div className="text-sm text-white/60 mt-1 flex gap-4">
                                <span>
                                    {discount.type === 'percent' ? `${discount.value}% خصم` : `-${discount.value} شيكل`}
                                </span>
                                <span>
                                    قبل {discount.min_advance_booking_days} أيام كحد أدنى
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => toggleActive(discount)} className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-lg text-white">
                                {discount.active ? 'تعطيل' : 'تفعيل'}
                            </button>
                            <button onClick={() => openModal(discount)} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white">
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(discount.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-white/60 hover:text-red-400">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">{editingDiscount ? 'تعديل الخصم' : 'خصم جديد'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-white/60 mb-1">الاسم</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-white/60 mb-1">النوع</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                                    >
                                        <option value="percent">نسبة مئوية (%)</option>
                                        <option value="flat">مبلغ ثابت (-)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-white/60 mb-1">القيمة</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-white/60 mb-1">أقل مدة للحجز المسبق (أيام)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.min_advance_booking_days}
                                    onChange={e => setFormData({ ...formData, min_advance_booking_days: Number(e.target.value) })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-white/60 hover:text-white"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="bg-white text-black px-4 py-2 rounded-lg hover:bg-white/90"
                                >
                                    حفظ الخصم
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
