'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { CalendarOverride, Hall } from '@/types'
import { Plus, Trash2, Calendar } from 'lucide-react'

// ... imports

export function OverridesTab({ halls }: { halls: Hall[] }) {
    const [overrides, setOverrides] = useState<CalendarOverride[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedHall, setSelectedHall] = useState<string>(halls[0]?.id || '')
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Form State
    const [formData, setFormData] = useState<Partial<CalendarOverride>>({
        date: '',
        price: 0
    })

    const supabase = createClient()

    useEffect(() => {
        if (selectedHall) fetchOverrides()
    }, [selectedHall])

    async function fetchOverrides() {
        setLoading(true)
        const { data, error } = await supabase
            .from('calendar_overrides')
            .select('*')
            .eq('hall_id', selectedHall)
            .order('date', { ascending: true })

        if (error) console.error(error)
        else setOverrides(data as CalendarOverride[])
        setLoading(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedHall) return

        const payload = {
            ...formData,
            hall_id: selectedHall
        }

        // Upsert based on hall_id + date unique constraint
        const { error } = await supabase
            .from('calendar_overrides')
            .upsert(payload, { onConflict: 'hall_id,date' })

        if (!error) {
            setIsModalOpen(false)
            fetchOverrides()
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('هل أنت متأكد؟')) return
        const { error } = await supabase.from('calendar_overrides').delete().eq('id', id)
        if (!error) fetchOverrides()
    }

    function openModal() {
        setFormData({
            date: '',
            price: 0
        })
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
                    <Plus className="w-4 h-4" /> إضافة استثناء
                </button>
            </div>

            <div className="grid gap-4">
                {overrides.map(override => (
                    <div key={override.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/10 p-3 rounded-lg">
                                <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">{override.date}</h3>
                                <p className="text-sm text-white/60">سعر يدوي: {override.price}</p>
                            </div>
                        </div>
                        <button onClick={() => handleDelete(override.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-white/60 hover:text-red-400">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">تحديد سعر يدوي</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-white/60 mb-1">التاريخ</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-white/60 mb-1">السعر</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
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
                                    حفظ الاستثناء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
