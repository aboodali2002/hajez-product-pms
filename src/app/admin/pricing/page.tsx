'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Hall } from '@/types'
import { PricingRulesTab } from '@/components/admin/pricing/PricingRulesTab'
import { DiscountsTab } from '@/components/admin/pricing/DiscountsTab'
import { OverridesTab } from '@/components/admin/pricing/OverridesTab'

export default function PricingPage() {
    const [activeTab, setActiveTab] = useState<'rules' | 'discounts' | 'overrides'>('rules')
    const [halls, setHalls] = useState<Hall[]>([])
    const [loading, setLoading] = useState(true)

    const supabase = createClient()

    useEffect(() => {
        async function fetchHalls() {
            const { data, error } = await supabase.from('halls').select('*')
            if (!error) setHalls(data as Hall[])
            setLoading(false)
        }
        fetchHalls()
    }, [])

    if (loading) return <div className="p-8 text-white">Loading...</div>

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Pricing Management</h1>
                <p className="text-white/60 mt-1">Manage pricing rules, discounts, and manual overrides.</p>
            </div>

            <div className="flex gap-4 border-b border-white/10 mb-8">
                <button
                    onClick={() => setActiveTab('rules')}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${activeTab === 'rules' ? 'text-white' : 'text-white/40 hover:text-white'
                        }`}
                >
                    Pricing Rules
                    {activeTab === 'rules' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('discounts')}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${activeTab === 'discounts' ? 'text-white' : 'text-white/40 hover:text-white'
                        }`}
                >
                    Discounts
                    {activeTab === 'discounts' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-t-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('overrides')}
                    className={`px-4 py-2 text-sm font-medium transition-colors relative ${activeTab === 'overrides' ? 'text-white' : 'text-white/40 hover:text-white'
                        }`}
                >
                    Manual Overrides
                    {activeTab === 'overrides' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-t-full" />
                    )}
                </button>
            </div>

            {activeTab === 'rules' && <PricingRulesTab halls={halls} />}
            {activeTab === 'discounts' && <DiscountsTab halls={halls} />}
            {activeTab === 'overrides' && <OverridesTab halls={halls} />}
        </div>
    )
}
