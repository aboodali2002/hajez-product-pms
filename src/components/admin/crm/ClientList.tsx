'use client'

import { useState } from 'react'
import { Client } from '@/types'
import { createClientAction, updateClientAction, deleteClientAction } from '@/app/admin/clients/actions'
import { Search, Plus, Edit2, Trash2, Phone, Mail, FileText, User, Clock } from 'lucide-react'
import { GlassButton } from '@/components/ui/GlassButton'
import { Modal } from '@/components/ui/Modal'
import Link from 'next/link'

// ... imports

export function ClientList({ initialClients }: { initialClients: Client[] }) {
    const [clients, setClients] = useState(initialClients)
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingClient, setEditingClient] = useState<Client | null>(null)

    const filteredClients = initialClients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const handleEdit = (client: Client) => {
        setEditingClient(client)
        setIsModalOpen(true)
    }

    const handleAdd = () => {
        setEditingClient(null)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
            await deleteClientAction(id)
        }
    }

    return (
        <div className="space-y-6" dir="rtl">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        type="text"
                        placeholder="بحث عن عميل بالاسم، الهاتف، أو البريد..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pe-10 ps-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30"
                    />
                </div>
                <GlassButton onClick={handleAdd}>
                    <Plus className="w-4 h-4 me-2" />
                    إضافة عميل
                </GlassButton>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredClients.map((client) => (
                    <div
                        key={client.id}
                        className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-white font-medium text-lg">{client.name}</h3>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm text-white/60">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-3 h-3" />
                                            <span dir="ltr">{client.phone}</span>
                                        </div>
                                        {client.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3 h-3" />
                                                {client.email}
                                            </div>
                                        )}
                                        {client.national_id && (
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-3 h-3" />
                                                الهوية: {client.national_id}
                                            </div>
                                        )}
                                    </div>
                                    {client.notes && (
                                        <p className="mt-2 text-sm text-white/40 italic">
                                            "{client.notes}"
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link
                                    href={`/admin/clients/${client.id}`}
                                    className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                                    title="عرض السجل"
                                >
                                    <Clock className="w-4 h-4" />
                                </Link>
                                <button
                                    onClick={() => handleEdit(client)}
                                    className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                                    title="تعديل"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(client.id)}
                                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10"
                                    title="حذف"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredClients.length === 0 && (
                    <div className="text-center py-12 text-white/40">
                        لا يوجد عملاء مطابقين للبحث.
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingClient ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
            >
                <form
                    action={async (formData) => {
                        if (editingClient) {
                            await updateClientAction(formData)
                        } else {
                            await createClientAction(formData)
                        }
                        setIsModalOpen(false)
                    }}
                    className="space-y-4"
                >
                    {editingClient && <input type="hidden" name="id" value={editingClient.id} />}

                    <div>
                        <label className="block text-sm text-white/60 mb-1">الاسم الكامل</label>
                        <input
                            name="name"
                            required
                            defaultValue={editingClient?.name}
                            placeholder="مثلاً: محمد أحمد"
                            className="w-full px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-white/30"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-white/60 mb-1">رقم الهاتف</label>
                            <input
                                name="phone"
                                required
                                defaultValue={editingClient?.phone}
                                placeholder="مثلاً: 05xxxxxxx"
                                dir="ltr"
                                className="w-full px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-white/30 text-end"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1">الهوية الوطنية (اختياري)</label>
                            <input
                                name="national_id"
                                defaultValue={editingClient?.national_id || ''}
                                placeholder="رقم الهوية"
                                className="w-full px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-white/30"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-white/60 mb-1">البريد الإلكتروني (اختياري)</label>
                        <input
                            name="email"
                            type="email"
                            defaultValue={editingClient?.email || ''}
                            placeholder="example@mail.com"
                            className="w-full px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-white/30"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-white/60 mb-1">ملاحظات (اختياري)</label>
                        <textarea
                            name="notes"
                            defaultValue={editingClient?.notes || ''}
                            placeholder="أي ملاحظات إضافية..."
                            rows={3}
                            className="w-full px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-white/30 resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-xl bg-white text-black font-medium hover:bg-white/90"
                        >
                            {editingClient ? 'حفظ التعديلات' : 'إضافة العميل'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
