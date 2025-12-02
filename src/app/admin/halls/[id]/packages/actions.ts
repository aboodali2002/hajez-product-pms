'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveHallPackage(hallId: string, serviceId: string, price: number, isActive: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('hall_services')
        .upsert({
            hall_id: hallId,
            service_id: serviceId,
            price,
            is_active: isActive
        }, { onConflict: 'hall_id, service_id' })

    if (error) throw new Error(error.message)

    revalidatePath(`/admin/halls/${hallId}/packages`)
}

export async function initializeLocalItems(hallId: string, serviceId: string) {
    const supabase = await createClient()

    // 1. Fetch global items
    const { data: globalItems } = await supabase
        .from('service_package_items')
        .select('name')
        .eq('service_id', serviceId)

    if (!globalItems) throw new Error('No global items found')

    // 2. Insert into local items
    if (globalItems.length > 0) {
        const { error: insertError } = await supabase
            .from('hall_package_items')
            .insert(
                globalItems.map(item => ({
                    hall_id: hallId,
                    service_id: serviceId,
                    name: item.name
                }))
            )
        if (insertError) throw new Error(insertError.message)
    }

    // 3. Set flag (Upsert to ensure record exists)
    const { error: upsertError } = await supabase
        .from('hall_services')
        .upsert({
            hall_id: hallId,
            service_id: serviceId,
            has_custom_items: true,
            // Default values if inserting
            price: 0,
            is_active: false
        }, { onConflict: 'hall_id, service_id', ignoreDuplicates: false })
    // Wait, upsert will overwrite price/is_active if we provide them and it exists.
    // We only want to update has_custom_items if it exists, or insert defaults if not.

    // Better approach: Check existence or use a more complex query.
    // Or just use two queries:
    // Try update first.
    const { data: updated, error: updateError } = await supabase
        .from('hall_services')
        .update({ has_custom_items: true })
        .eq('hall_id', hallId)
        .eq('service_id', serviceId)
        .select()

    if (updateError) throw new Error(updateError.message)

    if (!updated || updated.length === 0) {
        // Record didn't exist, insert it
        const { error: insertError } = await supabase
            .from('hall_services')
            .insert({
                hall_id: hallId,
                service_id: serviceId,
                has_custom_items: true,
                price: 0,
                is_active: false
            })
        if (insertError) throw new Error(insertError.message)
    }

    revalidatePath(`/admin/halls/${hallId}/packages`)
}

export async function resetToGlobal(hallId: string, serviceId: string) {
    const supabase = await createClient()

    // 1. Delete local items
    const { error: deleteError } = await supabase
        .from('hall_package_items')
        .delete()
        .eq('hall_id', hallId)
        .eq('service_id', serviceId)

    if (deleteError) throw new Error(deleteError.message)

    // 2. Reset flag
    const { error: updateError } = await supabase
        .from('hall_services')
        .update({ has_custom_items: false })
        .eq('hall_id', hallId)
        .eq('service_id', serviceId)

    if (updateError) throw new Error(updateError.message)

    revalidatePath(`/admin/halls/${hallId}/packages`)
}

export async function addLocalItem(hallId: string, serviceId: string, name: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('hall_package_items')
        .insert({
            hall_id: hallId,
            service_id: serviceId,
            name
        })

    if (error) throw new Error(error.message)

    revalidatePath(`/admin/halls/${hallId}/packages`)
}

export async function removeLocalItem(itemId: string, hallId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('hall_package_items')
        .delete()
        .eq('id', itemId)

    if (error) throw new Error(error.message)

    revalidatePath(`/admin/halls/${hallId}/packages`)
}
