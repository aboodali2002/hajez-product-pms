import { createClient } from '@/utils/supabase/server'
import { ClientList } from '@/components/admin/crm/ClientList'
import { Client } from '@/types'
import { getCompanyClients } from '@/services/data-service'

export default async function ClientsPage() {
    const supabase = await createClient()

    // Get current user's company_id from profile
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <div>
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Clients Management</h1>
                    <p className="text-white/60">Please log in to view clients.</p>
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
                    <h1 className="text-3xl font-bold text-white mb-2">Clients Management</h1>
                    <p className="text-white/60">Company not found.</p>
                </header>
            </div>
        )
    }

    // Use safe data service with company_id filtering
    const clients = await getCompanyClients(companyId)

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Clients Management</h1>
                <p className="text-white/60">Manage your customer database.</p>
            </header>

            <ClientList initialClients={(clients as Client[]) || []} />
        </div>
    )
}
