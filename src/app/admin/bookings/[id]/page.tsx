import { createClient } from '@/utils/supabase/server'
import { BookingDetail } from '@/components/admin/bookings/BookingDetail'
import { notFound } from 'next/navigation'

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    // 1. Fetch Booking
    const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
            *,
            client:clients(*),
            hall:halls(*)
        `)
        .eq('id', id)
        .single()

    if (error || !booking) {
        notFound()
    }

    // 2. Fetch Booking Services
    const { data: services } = await supabase
        .from('booking_services')
        .select('*')
        .eq('booking_id', id)

    // 3. Fetch Payments
    const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('booking_id', id)
        .order('payment_date', { ascending: false })

    // 4. Fetch Available Services for this Hall
    // Assuming we have a hall_services table linking halls and services
    // If not, we might need to fetch from packages or a global services list
    // For now, let's assume hall_services exists as per my type definition
    const { data: availableServices } = await supabase
        .from('hall_services')
        .select(`
            *,
            service:services_catalog(*)
        `)
        .eq('hall_id', booking.hall_id)

    return (
        <BookingDetail
            booking={booking}
            services={services || []}
            payments={payments || []}
            availableServices={availableServices || []}
        />
    )
}
