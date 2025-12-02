'use client'

import { useState } from 'react'
import { createHall, deleteHall } from '@/app/admin/halls/actions'
import { Trash2, Plus, Building2 } from 'lucide-react'

type Hall = {
    id: string
    name: string
    slug: string
    theme_color: string | null
}

export function HallList({ initialHalls }: { initialHalls: Hall[] }) {
    const [isAdding, setIsAdding] = useState(false)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">All Halls</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Hall
                </button>
            </div>

            {/* Add Form */}
            {isAdding && (
                <form
                    action={async (formData) => {
                        await createHall(formData)
                        setIsAdding(false)
                    }}
                    className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-4"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-white/60 mb-1">Name</label>
                            <input
                                name="name"
                                required
                                placeholder="e.g. Grand Ballroom"
                                className="w-full px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-white/30"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1">Slug</label>
                            <input
                                name="slug"
                                required
                                placeholder="e.g. grand-ballroom"
                                className="w-full px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-white/30"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-white/60 mb-1">Theme Color</label>
                            <select
                                name="color"
                                className="w-full px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-white/30"
                            >
                                <option value="blue">Blue</option>
                                <option value="purple">Purple</option>
                                <option value="gold">Gold</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-xl bg-white text-black font-medium hover:bg-white/90"
                        >
                            Create Hall
                        </button>
                    </div>
                </form>
            )}

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {initialHalls.map((hall) => (
                    <div
                        key={hall.id}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${hall.theme_color || 'blue'}-500/20 text-${hall.theme_color || 'blue'}-400`}>
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-white font-medium">{hall.name}</h3>
                                <p className="text-white/40 text-sm">/hall/{hall.slug}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <a
                                href={`/admin/halls/${hall.id}/packages`}
                                className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-sm hover:bg-white/10 hover:text-white transition-colors"
                            >
                                Packages
                            </a>
                            <button
                                onClick={() => deleteHall(hall.id)}
                                className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete Hall"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {initialHalls.length === 0 && (
                    <div className="text-center py-12 text-white/40">
                        No halls found. Create one to get started.
                    </div>
                )}
            </div>
        </div>
    )
}
