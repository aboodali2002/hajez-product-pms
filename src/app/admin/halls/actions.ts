'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createCompanyData, deleteCompanyData } from '@/services/data-service'

export async function createHall(formData: FormData) {
    const supabase = await createClient()

    // Get current user's company_id
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

    const companyId = profile?.company_id

    if (!companyId) {
        throw new Error('Company ID not found')
    }

    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const color = formData.get('color') as string || 'blue'
    const basePrice = formData.get('base_price') ? Number(formData.get('base_price')) : 5000

    // Use safe data service with company_id
    await createCompanyData('halls', companyId, {
        name,
        slug,
        theme_color: color,
        base_price: basePrice
    })

    revalidatePath('/admin/halls')
}

export async function deleteHall(hallId: string) {
    const supabase = await createClient()

    // Get current user's company_id
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

    const companyId = profile?.company_id

    if (!companyId) {
        throw new Error('Company ID not found')
    }

    // Use safe data service with company_id verification
    await deleteCompanyData('halls', companyId, hallId)

    revalidatePath('/admin/halls')
}
