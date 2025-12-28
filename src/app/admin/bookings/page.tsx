import { createClient } from '@/utils/supabase/server'
import { BookingList } from '@/components/admin/bookings/BookingList'
import { Booking } from '@/types'
import { getCompanyBookings, getCompanyPayments } from '@/services/data-service'

export default async function BookingsPage() {
    const supabase = await createClient()

    // Get current user's company_id from profile
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <div>
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Bookings</h1>
                    <p className="text-white/60">Please log in to view bookings.</p>
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
                    <h1 className="text-3xl font-bold text-white mb-2">Bookings</h1>
                    <p className="text-white/60">Company not found.</p>
                </header>
            </div>
        )
    }

    // Fetch bookings and payments using safe data service
    const bookings = await getCompanyBookings(companyId)
    const payments = await getCompanyPayments(companyId)

    // Map bookings to include flattened details and paid amount
    const bookingsWithDetails = (bookings || []).map((booking: any) => {
        const bookingPayments = payments?.filter(p => p.booking_id === booking.id) || []
        const paidAmount = bookingPayments.reduce((sum, p) => sum + Number(p.amount), 0)

        return {
            ...booking,
            client_name: booking.client?.name || 'Unknown Client',
            hall_name: booking.hall?.name || 'Unknown Hall',
            paid_amount: paidAmount
        }
    })

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Bookings</h1>
                <p className="text-white/60">Manage all your event bookings.</p>
            </header>

            <BookingList bookings={bookingsWithDetails} />
        </div>
    )
}
