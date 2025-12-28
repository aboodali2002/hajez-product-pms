import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { UserManagement } from '@/components/admin/UserManagement'
import { redirect } from 'next/navigation'

export default async function UsersPage() {
    const supabase = await createClient()

    // 1. Verify the current user is a platform_admin or company_owner
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, company_id')
        .eq('id', user.id)
        .single()

    if (!profile || !['platform_admin', 'company_owner'].includes(profile.role)) {
        redirect('/unauthorized')
    }

    // 2. Use Admin Client to fetch users (Bypassing RLS for reliability in Admin Dashboard)
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    )

    // Fetch users (profiles) - Platform admins see all, company owners see only their company
    let usersQuery = supabaseAdmin
        .from('profiles')
        .select('*')

    if (profile.role === 'company_owner' && profile.company_id) {
        usersQuery = usersQuery.eq('company_id', profile.company_id)
    }

    const { data: users, error: usersError } = await usersQuery.order('created_at', { ascending: false })

    if (usersError) {
        console.error('Error fetching users:', JSON.stringify(usersError, null, 2))
    }

    // Fetch halls for the dropdown (filtered by company for company_owner)
    let hallsQuery = supabaseAdmin
        .from('halls')
        .select('id, name')

    if (profile.role === 'company_owner' && profile.company_id) {
        hallsQuery = hallsQuery.eq('company_id', profile.company_id)
    }

    const { data: halls, error: hallsError } = await hallsQuery.order('name')

    if (hallsError) {
        console.error('Error fetching halls:', JSON.stringify(hallsError, null, 2))
    }

    // Manually join hall names to users
    const usersWithHalls = (users || []).map(user => {
        const assignedHall = halls?.find(h => h.id === user.assigned_hall_id)
        return {
            ...user,
            hall: assignedHall ? { name: assignedHall.name } : null
        }
    })

    return <UserManagement users={usersWithHalls} halls={halls || []} />
}
