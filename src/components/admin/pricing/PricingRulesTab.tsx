'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { PricingRule, Hall } from '@/types'
import { Plus, Trash2, Edit2, Calendar } from 'lucide-react'
import { format } from 'date-fns'

// ... imports

export function PricingRulesTab({ halls }: { halls: Hall[] }) {
    const [rules, setRules] = useState<PricingRule[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedHall, setSelectedHall] = useState<string>(halls[0]?.id || '')
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Form State
    const [editingRule, setEditingRule] = useState<PricingRule | null>(null)
    const [formData, setFormData] = useState<Partial<PricingRule>>({
        name: '',
        rule_level: 1,
        adjustment_type: 'fixed',
        adjustment_value: 0,
        days_of_week: [],
        start_date: '',
        end_date: ''
    })

    const supabase = createClient()

    useEffect(() => {
        if (selectedHall) fetchRules()
    }, [selectedHall])

    async function fetchRules() {
        setLoading(true)
        const { data, error } = await supabase
            .from('pricing_rules')
            .select('*')
            .eq('hall_id', selectedHall)
            .order('rule_level', { ascending: false })

        if (error) console.error(error)
        else setRules(data as PricingRule[])
        setLoading(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedHall) return

        const payload = {
            ...formData,
            hall_id: selectedHall,
            // Clean up empty strings to null for dates
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            // Ensure days_of_week is array
            days_of_week: formData.days_of_week || []
        }

        if (editingRule) {
            const { error } = await supabase
                .from('pricing_rules')
                .update(payload)
                .eq('id', editingRule.id)
            if (!error) {
                setIsModalOpen(false)
                setEditingRule(null)
                fetchRules()
            }
        } else {
            const { error } = await supabase
                .from('pricing_rules')
                .insert(payload)
            if (!error) {
                setIsModalOpen(false)
                fetchRules()
            }
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('هل أنت متأكد؟')) return
        const { error } = await supabase.from('pricing_rules').delete().eq('id', id)
        if (!error) fetchRules()
    }

    function openModal(rule?: PricingRule) {
        if (rule) {
            setEditingRule(rule)
            setFormData(rule)
        } else {
            setEditingRule(null)
            setFormData({
                name: '',
                rule_level: 1,
                adjustment_type: 'fixed',
                adjustment_value: 0,
                days_of_week: [],
                start_date: '',
                end_date: ''
            })
        }
        setIsModalOpen(true)
    }

    const days = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']

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
                    <Plus className="w-4 h-4" /> إضافة قاعدة
                </button>
            </div>

            <div className="grid gap-4">
                {rules.map(rule => (
                    <div key={rule.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-white">{rule.name}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full ${rule.rule_level === 3 ? 'bg-purple-500/20 text-purple-400' :
                                    rule.rule_level === 2 ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-green-500/20 text-green-400'
                                    }`}>
                                    مستوى {rule.rule_level}
                                </span>
                            </div>
                            <div className="text-sm text-white/60 mt-1 flex gap-4">
                                <span>
                                    {rule.adjustment_type === 'fixed' ? 'سعر ثابت: ' :
                                        rule.adjustment_type === 'flat' ? 'إضافة: ' : 'إضافة %: '}
                                    {rule.adjustment_value}
                                </span>
                                {(rule.start_date || rule.end_date) && (
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {rule.start_date} إلى {rule.end_date}
                                    </span>
                                )}
                                {rule.days_of_week && rule.days_of_week.length > 0 && (
                                    <span>
                                        الأيام: {rule.days_of_week.map(d => days[d]).join(', ')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => openModal(rule)} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white">
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(rule.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-white/60 hover:text-red-400">
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
                        <h2 className="text-xl font-bold text-white mb-4">{editingRule ? 'تعديل القاعدة' : 'قاعدة جديدة'}</h2>
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
                                    <label className="block text-sm text-white/60 mb-1">المستوى</label>
                                    <select
                                        value={formData.rule_level}
                                        onChange={e => setFormData({ ...formData, rule_level: Number(e.target.value) as 1 | 2 | 3 })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                                    >
                                        <option value={1}>1 - يوم من الأسبوع</option>
                                        <option value={2}>2 - موسم</option>
                                        <option value={3}>3 - خاص/عطلة</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-white/60 mb-1">النوع</label>
                                    <select
                                        value={formData.adjustment_type}
                                        onChange={e => setFormData({ ...formData, adjustment_type: e.target.value as any })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                                    >
                                        <option value="fixed">سعر ثابت</option>
                                        <option value="flat">زيادة ثابتة (+)</option>
                                        <option value="percent">زيادة نسبة (+%)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-white/60 mb-1">القيمة</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.adjustment_value}
                                    onChange={e => setFormData({ ...formData, adjustment_value: Number(e.target.value) })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-white/60 mb-1">تاريخ البدء</label>
                                    <input
                                        type="date"
                                        value={formData.start_date || ''}
                                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-white/60 mb-1">تاريخ الانتهاء</label>
                                    <input
                                        type="date"
                                        value={formData.end_date || ''}
                                        onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-white/60 mb-1">أيام الأسبوع</label>
                                <div className="flex flex-wrap gap-2">
                                    {days.map((day, idx) => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => {
                                                const current = formData.days_of_week || []
                                                const newDays = current.includes(idx)
                                                    ? current.filter(d => d !== idx)
                                                    : [...current, idx]
                                                setFormData({ ...formData, days_of_week: newDays })
                                            }}
                                            className={`px-3 py-1 rounded-full text-xs ${formData.days_of_week?.includes(idx)
                                                ? 'bg-white text-black'
                                                : 'bg-white/5 text-white/60'
                                                }`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
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
                                    حفظ القاعدة
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
