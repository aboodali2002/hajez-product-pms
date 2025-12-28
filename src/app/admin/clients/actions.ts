'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createClientAction(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const national_id = formData.get('national_id') as string
    const notes = formData.get('notes') as string

    if (!name || !phone) {
        throw new Error('Name and Phone are required')
    }

    const { error } = await supabase.from('clients').insert({
        name,
        phone,
        email: email || null,
        national_id: national_id || null,
        notes: notes || null
    })

    if (error) {
        console.error('Error creating client:', error)
        throw new Error('Failed to create client')
    }

    revalidatePath('/admin/clients')
}

export async function updateClientAction(formData: FormData) {
    const supabase = await createClient()

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const national_id = formData.get('national_id') as string
    const notes = formData.get('notes') as string

    if (!id || !name || !phone) {
        throw new Error('ID, Name and Phone are required')
    }

    const { error } = await supabase.from('clients').update({
        name,
        phone,
        email: email || null,
        national_id: national_id || null,
        notes: notes || null
    }).eq('id', id)

    if (error) {
        console.error('Error updating client:', error)
        throw new Error('Failed to update client')
    }

    revalidatePath('/admin/clients')
}

export async function deleteClientAction(id: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('clients').delete().eq('id', id)

    if (error) {
        console.error('Error deleting client:', error)
        throw new Error('Failed to delete client')
    }

    revalidatePath('/admin/clients')
}
