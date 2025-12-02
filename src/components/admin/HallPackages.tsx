'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveHallPackage, initializeLocalItems, resetToGlobal, addLocalItem, removeLocalItem } from '@/app/admin/halls/[id]/packages/actions'
import { Package, Check, X, Edit2, RotateCcw, Plus } from 'lucide-react'

type ServicePackage = {
    id: string
    name: string
    items: { id: string, name: string }[]
}

type HallService = {
    service_id: string
    price: number
    is_active: boolean
    has_custom_items: boolean
}

type LocalItem = {
    id: string
    service_id: string
    name: string
}

export function HallPackages({
    hallId,
    globalPackages,
    hallServices,
    localItems
}: {
    hallId: string,
    globalPackages: ServicePackage[],
    hallServices: HallService[],
    localItems: LocalItem[]
}) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
                {globalPackages.map((pkg) => {
                    const hallService = hallServices.find(hs => hs.service_id === pkg.id)
                    const isActive = hallService?.is_active || false
                    const price = hallService?.price || 0
                    const hasCustomItems = hallService?.has_custom_items || false

                    // Filter local items for this package
                    const pkgLocalItems = localItems.filter(item => item.service_id === pkg.id)

                    return (
                        <PackageCard
                            key={pkg.id}
                            hallId={hallId}
                            pkg={pkg}
                            initialActive={isActive}
                            initialPrice={price}
                            hasCustomItems={hasCustomItems}
                            localItems={pkgLocalItems}
                        />
                    )
                })}
            </div>
        </div>
    )
}

function PackageCard({
    hallId,
    pkg,
    initialActive,
    initialPrice,
    hasCustomItems,
    localItems
}: {
    hallId: string,
    pkg: ServicePackage,
    initialActive: boolean,
    initialPrice: number,
    hasCustomItems: boolean,
    localItems: LocalItem[]
}) {
    const [isActive, setIsActive] = useState(initialActive)
    const [price, setPrice] = useState(initialPrice)
    const [isSaving, setIsSaving] = useState(false)

    const router = useRouter()

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await saveHallPackage(hallId, pkg.id, price, isActive)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Failed to save')
        } finally {
            setIsSaving(false)
        }
    }

    const handleCustomize = async () => {
        if (!confirm('This will create a custom list of items for this hall. Continue?')) return
        try {
            await initializeLocalItems(hallId, pkg.id)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Failed to initialize custom items')
        }
    }

    const handleReset = async () => {
        if (!confirm('This will delete all custom items and revert to the global list. Continue?')) return
        try {
            await resetToGlobal(hallId, pkg.id)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Failed to reset')
        }
    }

    return (
        <div className={`p-6 rounded-3xl border transition-all ${isActive
                ? 'bg-white/10 border-white/20'
                : 'bg-white/5 border-white/5 opacity-75'
            }`}>
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'
                        }`}>
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                        <p className="text-white/40 text-sm">
                            {hasCustomItems ? 'Custom Items' : 'Global Items'} • {hasCustomItems ? localItems.length : pkg.items.length} items
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-sm text-white/60">Enabled</span>
                        <div
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${isActive ? 'bg-green-500' : 'bg-white/20'
                                }`}
                            onClick={() => setIsActive(!isActive)}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0'
                                }`} />
                        </div>
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Items List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-white/60">Included Items</h4>
                        {hasCustomItems ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleReset}
                                    className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors"
                                    title="Reset to Global Defaults"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleCustomize}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                            >
                                <Edit2 className="w-3 h-3" />
                                Customize
                            </button>
                        )}
                    </div>

                    <div className="space-y-2">
                        {hasCustomItems ? (
                            // Local Items List
                            <>
                                {localItems.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-2 text-white/80">
                                            <Check className="w-4 h-4 text-green-400" />
                                            <span>{item.name}</span>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                await removeLocalItem(item.id, hallId)
                                                router.refresh()
                                            }}
                                            className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}

                                {/* Add Local Item Form */}
                                <form
                                    action={async (formData) => {
                                        const name = formData.get('name') as string
                                        if (name) {
                                            await addLocalItem(hallId, pkg.id, name)
                                            router.refresh()
                                        }
                                    }}
                                    className="flex gap-2 mt-2"
                                >
                                    <input
                                        name="name"
                                        placeholder="Add custom item..."
                                        className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-white/30"
                                    />
                                    <button
                                        type="submit"
                                        className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </form>
                            </>
                        ) : (
                            // Global Items List (Read Only)
                            pkg.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-2 text-white/80 opacity-75">
                                    <Check className="w-4 h-4 text-white/40" />
                                    <span>{item.name}</span>
                                </div>
                            ))
                        )}

                        {!hasCustomItems && pkg.items.length === 0 && (
                            <p className="text-white/20 text-sm italic">No global items defined.</p>
                        )}
                    </div>
                </div>

                {/* Pricing Configuration */}
                <div className="bg-black/20 p-4 rounded-2xl h-fit">
                    <label className="block text-sm text-white/60 mb-2">Price for this Hall</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            disabled={!isActive}
                            className="flex-1 px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-white/30 disabled:opacity-50"
                        />
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-2 rounded-xl bg-white text-black font-medium hover:bg-white/90 disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
