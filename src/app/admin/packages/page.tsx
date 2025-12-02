import { createClient } from '@/utils/supabase/server'
import { PackageList } from '@/components/admin/PackageList'

export default async function PackagesPage() {
    const supabase = await createClient()

    const { data: packages } = await supabase
        .from('services_catalog')
        .select('*, items:service_package_items(*)')
        .order('created_at', { ascending: true })

    // Transform data to match component type if needed, or rely on loose typing
    // Supabase returns items as an array, which matches our type.

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Global Packages</h1>
                <p className="text-white/60">Manage service packages and their items.</p>
            </header>

            <PackageList initialPackages={packages || []} />
        </div>
    )
}
