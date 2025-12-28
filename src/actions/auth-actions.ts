'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { UserRole } from '@/types'

// Initialize Admin Client
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

type CreateUserParams = {
    email: string
    password: string
    fullName: string
    role: UserRole
    assignedHallId?: string
}

export async function createUser(params: CreateUserParams) {
    const supabase = await createClient()

    // 1. Authorization Check
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const { data: requesterProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role, company_id')
        .eq('id', user.id)
        .single()

    if (profileError || !['platform_admin', 'company_owner'].includes(requesterProfile.role)) {
        throw new Error('Only Platform Admins and Company Owners can create users')
    }

    // 2. Determine company_id before creating user
    const companyId = requesterProfile.role === 'company_owner'
        ? requesterProfile.company_id
        : null

    if (!companyId && requesterProfile.role === 'company_owner') {
        throw new Error('Company owner must have a company_id')
    }

    // 3. Create User using Admin Client with company_id in metadata
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: params.email,
        password: params.password,
        email_confirm: true,
        user_metadata: {
            full_name: params.fullName,
            role: params.role,
            company_id: companyId,
            assigned_hall_id: params.assignedHallId || null,
        },
    })

    if (authError) {
        throw new Error(authError.message)
    }

    if (!authData.user) {
        throw new Error('Failed to create user')
    }

    // 4. The trigger SHOULD automatically create the profile, but we add a safety fallback
    // Wait a brief moment for trigger
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify profile exists
    const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single();

    if (!existingProfile) {
        // Manual fallback if trigger failed
        const { error: manualProfileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: authData.user.id,
                email: params.email,
                role: params.role,
                full_name: params.fullName,
                assigned_hall_id: params.assignedHallId || null,
                company_id: companyId // Explicitly set it
            });

        if (manualProfileError) {
            console.error('Manual profile creation failed:', manualProfileError);
            // Verify one last time if it was a race condition
            const { data: retryProfile } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('id', authData.user.id)
                .single();

            if (!retryProfile) {
                throw new Error('Failed to create user profile: ' + manualProfileError.message);
            }
        }
    }

    return { success: true, userId: authData.user.id }
}
