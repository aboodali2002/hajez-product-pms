import { createClient } from '@/utils/supabase/server'
import { ClientDetail } from '@/components/admin/crm/ClientDetail'
import { notFound } from 'next/navigation'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    // 1. Fetch Client
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

    if (clientError || !client) {
        notFound()
    }

    // 2. Fetch Client's Bookings
    const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
            *,
            hall:halls(name)
        `)
        .eq('client_id', id)
        .order('event_date', { ascending: false })

    if (bookingsError) {
        console.error('Error fetching client bookings:', bookingsError)
    }

    return (
        <ClientDetail
            client={client}
            bookings={bookings || []}
        />
    )
}
