
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { UserRole } from '@/types'

export async function getCurrentProfile() {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        return null
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        return null
    }

    return { user, profile }
}

export async function requireRole(allowedRoles: UserRole[]) {
    const data = await getCurrentProfile()

    if (!data) {
        redirect('/login')
    }

    // @ts-ignore
    if (!allowedRoles.includes(data.profile.role)) {
        redirect('/unauthorized')
    }

    return data
}
