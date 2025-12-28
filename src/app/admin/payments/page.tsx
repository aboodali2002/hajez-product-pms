import { createClient } from '@/utils/supabase/server'
import { PaymentList } from '@/components/admin/payments/PaymentList'
import { PaymentStats } from '@/components/admin/payments/PaymentStats'
import { PendingBookingsList } from '@/components/admin/payments/PendingBookingsList'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { getCompanyPayments, getCompanyBookings } from '@/services/data-service'

export default async function PaymentsPage() {
    const supabase = await createClient()

    // Get current user's company_id from profile
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <div>
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Financial Dashboard</h1>
                    <p className="text-white/60">Please log in to view payments.</p>
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
                    <h1 className="text-3xl font-bold text-white mb-2">Financial Dashboard</h1>
                    <p className="text-white/60">Company not found.</p>
                </header>
            </div>
        )
    }

    // Use safe data service with company_id filtering
    const payments = await getCompanyPayments(companyId)

    // Fetch pending bookings (not fully paid)
    const allBookings = await getCompanyBookings(companyId)
    const pendingBookings = allBookings.filter(
        b => b.financial_status !== 'fully_paid' && b.status !== 'cancelled'
    )

    // Calculate paid amount for pending bookings
    const pendingBookingsWithDetails = pendingBookings.map((booking: any) => {
        const bookingPayments = payments?.filter(p => p.booking_id === booking.id) || []
        const paidAmount = bookingPayments.reduce((sum, p) => sum + Number(p.amount), 0)

        return {
            ...booking,
            client_name: booking.client?.name || 'Unknown Client',
            hall_name: booking.hall?.name || 'Unknown Hall',
            paid_amount: paidAmount
        }
    })

    // Process payments for display
    const paymentsWithDetails = (payments || []).map((p: any) => {
        // Find the booking for this payment
        const booking = allBookings.find(b => b.id === p.booking_id)

        return {
            ...p,
            client_name: booking?.client?.name || 'Unknown Client',
            hall_name: booking?.hall?.name || 'Unknown Hall',
            booking_status: booking?.status || 'unknown'
        }
    })

    // Calculate Stats
    const totalRevenue = paymentsWithDetails.reduce((sum, p) => sum + Number(p.amount), 0)

    const now = new Date()
    const startMonth = startOfMonth(now)
    const endMonth = endOfMonth(now)

    const monthlyRevenue = paymentsWithDetails
        .filter(p => {
            const date = new Date(p.payment_date)
            return date >= startMonth && date <= endMonth
        })
        .reduce((sum, p) => sum + Number(p.amount), 0)

    const transactionCount = paymentsWithDetails.length
    const avgTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Financial Dashboard</h1>
                <p className="text-white/60">Track your income and transactions.</p>
            </header>

            <PaymentStats
                totalRevenue={totalRevenue}
                monthlyRevenue={monthlyRevenue}
                transactionCount={transactionCount}
                avgTransaction={avgTransaction}
            />

            <PendingBookingsList bookings={pendingBookingsWithDetails} />

            <h2 className="text-xl font-semibold text-white mb-4">Transaction History</h2>
            <PaymentList payments={paymentsWithDetails} />
        </div>
    )
}
