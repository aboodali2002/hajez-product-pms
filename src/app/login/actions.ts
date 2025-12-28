'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        redirect('/login?error=Could not authenticate user')
    }

    revalidatePath('/', 'layout')
    redirect('/admin')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const companyName = formData.get('companyName') as string

    console.log('Signup attempt:', { email, fullName, companyName })

    // Step 1: Create auth user first
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                company_name: companyName,
            }
        }
    })

    if (authError || !authData.user) {
        console.error('Auth signup error:', authError)
        redirect(`/login?error=${encodeURIComponent(authError?.message || 'Could not create account')}`)
    }

    console.log('User created:', authData.user.id)

    // Step 2: Auto-confirm email using admin client
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
        authData.user.id,
        { email_confirm: true }
    )

    if (confirmError) {
        console.error('Email confirmation error:', confirmError)
        // Cleanup: delete the auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        redirect(`/login?error=${encodeURIComponent('Failed to confirm email')}`)
    }

    console.log('Email confirmed for user:', authData.user.id)

    // Step 3: Create company (admin client already initialized in Step 2)
    const companySlug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Math.floor(Math.random() * 1000)

    const { data: companyData, error: companyError } = await supabaseAdmin
        .from('companies')
        .insert({
            name: companyName,
            slug: companySlug,
            owner_id: authData.user.id,
            subscription_tier: 'free',
            subscription_status: 'active',
            max_halls: 1,
            max_users: 3,
            primary_color: '#8b5cf6',
        })
        .select()
        .single()

    if (companyError || !companyData) {
        console.error('Company creation error:', companyError)
        // Cleanup: delete the auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        redirect(`/login?error=${encodeURIComponent('Failed to create company')}`)
    }

    console.log('Company created:', companyData.id)

    // Step 4: Create/Update profile manually using admin client (Handling race condition with trigger)
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: authData.user.id,
            email: email,
            full_name: fullName,
            role: 'company_owner',
            company_id: companyData.id,
            assigned_hall_id: null,
        }, { onConflict: 'id' })

    if (profileError) {
        console.error('Profile creation error:', profileError)
        // Cleanup: delete company and user
        await supabaseAdmin.from('companies').delete().eq('id', companyData.id)
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        redirect(`/login?error=${encodeURIComponent('Failed to create profile')}`)
    }

    console.log('Profile created successfully')

    // Step 5: Sign in the user
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (signInError) {
        console.error('Auto sign-in error:', signInError)
        redirect('/login?error=Account created but auto-login failed. Please login manually.')
    }

    revalidatePath('/', 'layout')
    redirect('/admin?welcome=true')
}
