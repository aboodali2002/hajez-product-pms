'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPackage(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string

    const { error } = await supabase
        .from('services_catalog')
        .insert({ name, is_global: true })

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin/packages')
}

export async function deletePackage(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('services_catalog')
        .delete()
        .eq('id', id)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin/packages')
}

export async function addItemToPackage(formData: FormData) {
    const supabase = await createClient()

    const serviceId = formData.get('serviceId') as string
    const name = formData.get('name') as string

    const { error } = await supabase
        .from('service_package_items')
        .insert({ service_id: serviceId, name })

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin/packages')
}

export async function deleteItemFromPackage(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('service_package_items')
        .delete()
        .eq('id', id)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin/packages')
}
