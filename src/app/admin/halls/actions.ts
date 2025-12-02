'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createHall(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const color = formData.get('color') as string || 'blue'

    const { error } = await supabase
        .from('halls')
        .insert({ name, slug, theme_color: color })

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin/halls')
}

export async function deleteHall(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('halls')
        .delete()
        .eq('id', id)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin/halls')
}
