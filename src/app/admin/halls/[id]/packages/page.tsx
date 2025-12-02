import { createClient } from '@/utils/supabase/server'
import { HallPackages } from '@/components/admin/HallPackages'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function HallPackagesPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { id } = await params

    // Fetch Hall
    const { data: hall } = await supabase
        .from('halls')
        .select('*')
        .eq('id', id)
        .single()

    // Fetch Global Packages with Items
    const { data: globalPackages } = await supabase
        .from('services_catalog')
        .select('*, items:service_package_items(*)')
        .order('created_at', { ascending: true })

    // Fetch Hall Services (Configuration)
    const { data: hallServices } = await supabase
        .from('hall_services')
        .select('*')
        .eq('hall_id', id)

    // Fetch Local Items (Overrides)
    const { data: localItems } = await supabase
        .from('hall_package_items')
        .select('*')
        .eq('hall_id', id)
        .order('created_at', { ascending: true })

    if (!hall) return <div>Hall not found</div>

    return (
        <div>
            <header className="mb-8">
                <Link
                    href="/admin/halls"
                    className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Halls
                </Link>
                <h1 className="text-3xl font-bold text-white mb-2">Configure Packages</h1>
                <p className="text-white/60">Manage service packages for <span className="text-white font-medium">{hall.name}</span>.</p>
            </header>

            <HallPackages
                hallId={id}
                globalPackages={globalPackages || []}
                hallServices={hallServices || []}
                localItems={localItems || []}
            />
        </div>
    )
}
