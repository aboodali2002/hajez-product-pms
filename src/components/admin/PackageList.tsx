'use client'

import { useState } from 'react'
import { createPackage, deletePackage, addItemToPackage, deleteItemFromPackage } from '@/app/admin/packages/actions'
import { Trash2, Plus, Package, List, X } from 'lucide-react'

type PackageItem = {
    id: string
    name: string
}

type ServicePackage = {
    id: string
    name: string
    items: PackageItem[]
}

export function PackageList({ initialPackages }: { initialPackages: ServicePackage[] }) {
    const [isAddingPkg, setIsAddingPkg] = useState(false)
    const [expandedPkg, setExpandedPkg] = useState<string | null>(null)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Global Packages</h2>
                <button
                    onClick={() => setIsAddingPkg(!isAddingPkg)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create Package
                </button>
            </div>

            {/* Add Package Form */}
            {isAddingPkg && (
                <form
                    action={async (formData) => {
                        await createPackage(formData)
                        setIsAddingPkg(false)
                    }}
                    className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm flex gap-4"
                >
                    <input
                        name="name"
                        required
                        placeholder="Package Name (e.g. Facilities)"
                        className="flex-1 px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-white/30"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-white text-black font-medium hover:bg-white/90"
                    >
                        Create
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsAddingPkg(false)}
                        className="px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5"
                    >
                        Cancel
                    </button>
                </form>
            )}

            {/* Packages List */}
            <div className="grid grid-cols-1 gap-4">
                {initialPackages.map((pkg) => (
                    <div
                        key={pkg.id}
                        className="rounded-2xl bg-white/5 border border-white/5 overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                            <div
                                className="flex items-center gap-4 cursor-pointer flex-1"
                                onClick={() => setExpandedPkg(expandedPkg === pkg.id ? null : pkg.id)}
                            >
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500/20 text-purple-400">
                                    <Package className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-white font-medium">{pkg.name}</h3>
                                    <p className="text-white/40 text-sm">{pkg.items.length} items</p>
                                </div>
                            </div>

                            <button
                                onClick={() => deletePackage(pkg.id)}
                                className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                                title="Delete Package"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Items List (Expanded) */}
                        {expandedPkg === pkg.id && (
                            <div className="bg-black/20 p-4 border-t border-white/5">
                                <div className="space-y-2 mb-4">
                                    {pkg.items.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                                            <div className="flex items-center gap-3">
                                                <List className="w-4 h-4 text-white/40" />
                                                <span className="text-white/80">{item.name}</span>
                                            </div>
                                            <button
                                                onClick={() => deleteItemFromPackage(item.id)}
                                                className="text-white/20 hover:text-red-400 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {pkg.items.length === 0 && (
                                        <p className="text-white/20 text-sm italic p-2">No items in this package.</p>
                                    )}
                                </div>

                                {/* Add Item Form */}
                                <form
                                    action={addItemToPackage}
                                    className="flex gap-2"
                                >
                                    <input type="hidden" name="serviceId" value={pkg.id} />
                                    <input
                                        name="name"
                                        required
                                        placeholder="Add item (e.g. Perfume Table)"
                                        className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-white/30"
                                    />
                                    <button
                                        type="submit"
                                        className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20"
                                    >
                                        Add
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                ))}

                {initialPackages.length === 0 && (
                    <div className="text-center py-12 text-white/40">
                        No packages found. Create one to get started.
                    </div>
                )}
            </div>
        </div>
    )
}
