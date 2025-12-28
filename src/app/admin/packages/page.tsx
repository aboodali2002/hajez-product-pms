import { createClient } from '@/utils/supabase/server'
import { PackageList } from '@/components/admin/PackageList'
import { getCompanyData } from '@/services/data-service'

export default async function PackagesPage() {
    const supabase = await createClient()

    // Get current user's company_id from profile
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <div>
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Global Packages</h1>
                    <p className="text-white/60">Please log in to view packages.</p>
                </header>
            </div>
        )
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

    const companyId = profile?.company_id

    if (!companyId) {
        console.error('No company_id found for user')
        return (
            <div>
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Global Packages</h1>
                    <p className="text-white/60">Company not found.</p>
                </header>
            </div>
        )
    }

    // Use safe data service with company_id filtering
    // Note: services_catalog should have company_id column based on the migration
    const packages = await getCompanyData('services_catalog', companyId, {
        select: '*, items:service_package_items(*)',
        orderBy: { column: 'created_at', ascending: true }
    })

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Service Packages</h1>
                <p className="text-white/60">Manage service packages and their items.</p>
            </header>

            <PackageList initialPackages={packages || []} />
        </div>
    )
}
