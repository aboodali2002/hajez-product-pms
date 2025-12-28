'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createBookingAction(formData: FormData) {
    const supabase = await createClient()

    const hall_id = formData.get('hall_id') as string
    const client_id = formData.get('client_id') as string
    const event_date = formData.get('event_date') as string
    const total_price = formData.get('total_price') as string
    const status = formData.get('status') as string || 'tentative'
    const notes = formData.get('notes') as string

    if (!hall_id || !client_id || !event_date || !total_price) {
        throw new Error('Hall, Client, Date, and Price are required')
    }

    const { error } = await supabase.from('bookings').insert({
        hall_id,
        client_id,
        event_date,
        total_price: parseFloat(total_price),
        status,
        notes: notes || null
    })

    if (error) {
        console.error('Error creating booking:', error)
        throw new Error(error.message)
    }

    revalidatePath('/admin/calendar')
    revalidatePath('/admin/bookings')
}

export async function updateBookingStatusAction(bookingId: string, status: string, reason?: string) {
    const supabase = await createClient()

    const updateData: any = { status }
    if (status === 'cancelled' && reason) {
        updateData.cancellation_reason = reason
    }

    const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)

    if (error) {
        console.error('Error updating booking status:', error)
        throw new Error('Failed to update booking status')
    }

    revalidatePath('/admin/calendar')
    revalidatePath('/admin/bookings')
}

export async function searchClientsAction(query: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('clients')
        .select('id, name, phone')
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(5)

    if (error) {
        console.error('Error searching clients:', error)
        return []
    }

    return data
}

export async function createQuickBookingAction(formData: FormData) {
    const supabase = await createClient()

    const hall_id = formData.get('hall_id') as string
    const event_date = formData.get('event_date') as string
    const total_price = formData.get('total_price') as string
    const client_name = formData.get('client_name') as string
    const client_phone = formData.get('client_phone') as string
    const existing_client_id = formData.get('client_id') as string

    if (!hall_id || !event_date || !total_price || !client_name || !client_phone) {
        throw new Error('All fields are required')
    }

    let client_id = existing_client_id

    // If no existing client selected, check by phone or create new
    if (!client_id) {
        // Check if phone exists
        const { data: existingClient } = await supabase
            .from('clients')
            .select('id')
            .eq('phone', client_phone)
            .single()

        if (existingClient) {
            client_id = existingClient.id
        } else {
            // Create new client
            const { data: newClient, error: createError } = await supabase
                .from('clients')
                .insert({
                    name: client_name,
                    phone: client_phone
                })
                .select('id')
                .single()

            if (createError) {
                throw new Error('Failed to create client: ' + createError.message)
            }
            client_id = newClient.id
        }
    }

    // Create Booking
    const { error: bookingError } = await supabase.from('bookings').insert({
        hall_id,
        client_id,
        event_date,
        total_price: parseFloat(total_price),
        status: 'tentative'
    })

    if (bookingError) {
        throw new Error('Failed to create booking: ' + bookingError.message)
    }

    revalidatePath('/admin/calendar')
    revalidatePath('/admin/bookings')
}

export async function updateClientNationalIdAction(clientId: string, nationalId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('clients')
        .update({ national_id: nationalId })
        .eq('id', clientId)

    if (error) {
        throw new Error('Failed to update National ID')
    }

    revalidatePath('/admin/bookings')
}

export async function addBookingServiceAction(bookingId: string, serviceName: string, price: number) {
    const supabase = await createClient()

    // 1. Add Service
    const { error: serviceError } = await supabase.from('booking_services').insert({
        booking_id: bookingId,
        service_name: serviceName,
        price: price,
        quantity: 1
    })

    if (serviceError) throw new Error('Failed to add service')

    // 2. Update Total Price
    // Fetch current total
    const { data: booking } = await supabase.from('bookings').select('total_price').eq('id', bookingId).single()
    if (booking) {
        await supabase.from('bookings').update({
            total_price: booking.total_price + price
        }).eq('id', bookingId)
    }

    revalidatePath(`/admin/bookings/${bookingId}`)
}

export async function removeBookingServiceAction(serviceId: string, bookingId: string, price: number) {
    const supabase = await createClient()

    // 1. Remove Service
    const { error } = await supabase.from('booking_services').delete().eq('id', serviceId)
    if (error) throw new Error('Failed to remove service')

    // 2. Update Total Price
    const { data: booking } = await supabase.from('bookings').select('total_price').eq('id', bookingId).single()
    if (booking) {
        await supabase.from('bookings').update({
            total_price: booking.total_price - price
        }).eq('id', bookingId)
    }

    revalidatePath(`/admin/bookings/${bookingId}`)
}

export async function recordPaymentAction(formData: FormData) {
    const booking_id = formData.get('booking_id') as string
    const amount = parseFloat(formData.get('amount') as string)
    const payment_method = formData.get('payment_method') as string
    const payment_category = formData.get('payment_type') as string // Using payment_type as category from UI for now, or map it
    const reference_no = formData.get('reference_no') as string
    const notes = formData.get('notes') as string

    // Map UI payment_type to payment_category if needed, or assume they match
    // UI has 'deposit', 'full_payment', 'remaining'.
    // Schema has 'deposit', 'settlement', 'refund'.
    // We need to map.
    let category = 'settlement'
    if (payment_category === 'deposit') category = 'deposit'
    if (payment_category === 'refund') category = 'refund'

    // For 'full_payment' and 'remaining', we treat as 'settlement' unless specified otherwise.
    // But wait, if it's 'deposit' in UI, it maps to 'deposit'.

    if (!booking_id || !amount || !payment_method || !payment_category) {
        throw new Error('Missing required fields')
    }

    try {
        const result = await processPayment(booking_id, amount, category, payment_category, payment_method, reference_no, notes)
        if (result.warning) {
            // We can't easily return a warning to the client with server actions unless we return state.
            // But for now we will just revalidate. The UI might not show the toast unless we return it.
            // The prompt says "Show a warning toast".
            // Server actions usually return void or data.
            // I will throw a specific error if I want to show a toast, or better, return a result object.
            // But the current implementation uses try/catch in the component.
            // I will return the warning message if possible, but the component expects void or error throw.
            // I will throw an error with a special prefix if it's a warning? No that's bad.
            // I will just let it pass for now, or maybe the component needs to be updated to handle return values.
            // Given the existing code uses `await recordPaymentAction(formData)`, I should probably change the signature or just rely on the UI to check the status.
            // However, the prompt says "Show a warning toast".
            // I will implement `processPayment` to return the warning, and I will change `recordPaymentAction` to return it.
            // But I need to update the component to read the return value.
            return { success: true, warning: result.warning }
        }
        return { success: true }
    } catch (error: any) {
        throw new Error(error.message)
    }

    revalidatePath(`/admin/bookings/${booking_id}`)
    revalidatePath('/admin/bookings')
}

export async function updateBookingDepositPercentageAction(bookingId: string, percentage: number) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('bookings')
        .update({ deposit_percentage: percentage })
        .eq('id', bookingId)

    if (error) throw new Error('Failed to update deposit percentage')

    revalidatePath(`/admin/bookings/${bookingId}`)
}

async function processPayment(
    bookingId: string,
    amount: number,
    category: string,
    paymentType: string,
    method: string,
    reference_no?: string,
    notes?: string
) {
    const supabase = await createClient()

    // 1. Fetch Booking and Payments
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()

    if (bookingError || !booking) throw new Error('Booking not found')

    const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('booking_id', bookingId)

    if (paymentsError) throw new Error('Failed to fetch payments')

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const remaining = booking.total_price - totalPaid

    // Rule 3: Safety Checks - Prevent overpayment
    // Allow small epsilon for float errors if needed, but strict for now.
    if (amount > remaining) {
        throw new Error(`Payment amount (${amount}) exceeds remaining balance (${remaining})`)
    }

    // 2. Record Payment
    const { error: paymentError } = await supabase.from('payments').insert({
        booking_id: bookingId,
        amount,
        payment_method: method,
        payment_category: category,
        payment_type: paymentType,
        reference_no: reference_no || null,
        notes: notes || null
    })

    if (paymentError) throw new Error('Failed to record payment: ' + paymentError.message)

    // 3. Calculate New State
    const newTotalPaid = totalPaid + amount
    const requiredDeposit = booking.total_price * (booking.deposit_percentage || 0.30)

    let newStatus = booking.status
    let warning = null

    // Rule 1: Confirmation Threshold
    if (category === 'deposit') {
        if (newTotalPaid >= requiredDeposit) {
            newStatus = 'confirmed'
        } else {
            // Only warn if we are still tentative
            if (booking.status === 'tentative') {
                warning = "Payment recorded, but below 30% threshold. Booking remains Tentative."
            }
        }
    }

    // Rule 2: Financial Status Updates
    let financialStatus = 'unpaid'
    if (newTotalPaid >= booking.total_price) {
        financialStatus = 'fully_paid'
    } else if (newTotalPaid > 0) {
        financialStatus = 'partially_paid'
    }

    // Update Booking
    const { error: updateError } = await supabase
        .from('bookings')
        .update({
            status: newStatus,
            financial_status: financialStatus
        })
        .eq('id', bookingId)

    if (updateError) throw new Error('Failed to update booking status')

    return { warning }
}

export async function confirmBookingAction(bookingId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId)

    if (error) throw new Error('Failed to confirm booking')

    revalidatePath(`/admin/bookings/${bookingId}`)
    revalidatePath('/admin/bookings')
    revalidatePath('/admin/calendar')
}

export async function cancelBookingAction(bookingId: string, reason: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('bookings')
        .update({
            status: 'cancelled',
            cancellation_reason: reason
        })
        .eq('id', bookingId)

    if (error) throw new Error('Failed to cancel booking')

    revalidatePath(`/admin/bookings/${bookingId}`)
    revalidatePath('/admin/bookings')
    revalidatePath('/admin/calendar')
}
