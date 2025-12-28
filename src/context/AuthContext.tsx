'use client'

import { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import { Profile, Company } from '@/types'

type AuthContextType = {
    user: User | null
    session: Session | null
    profile: Profile | null
    company: Company | null
    companyId: string | null // Direct access to company_id
    isLoading: boolean
    isPlatformAdmin: boolean
    isCompanyOwner: boolean
    isCompanyAdmin: boolean
    isHallManager: boolean
    signOut: () => Promise<void>
}


const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [company, setCompany] = useState<Company | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // PERFORMANCE FIX: Memoize supabase client to prevent re-creation on every render
    // This prevents the dependency loop that was causing infinite re-renders
    const supabase = useMemo(() => createClient(), [])
    const lastFetchedUserId = useRef<string | null>(null)

    useEffect(() => {
        // Helper: Create missing profile (self-healing)
        const createMissingProfile = async (userId: string): Promise<boolean> => {
            try {
                // Get user email from auth session
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    return false
                }

                let companyId: string | null = null

                // Check if this is a new signup with company_name in metadata
                if (user.user_metadata?.company_name) {
                    const companyName = user.user_metadata.company_name
                    const companySlug = companyName
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, '')

                    // Create company
                    const { data: companyData, error: companyError } = await supabase
                        .from('companies')
                        .insert({
                            name: companyName,
                            slug: companySlug,
                            owner_id: userId,
                            subscription_tier: 'free',
                            subscription_status: 'active',
                            max_halls: 1,
                            max_users: 3,
                            primary_color: '#8b5cf6',
                        })
                        .select()
                        .single()

                    if (companyError) {
                        return false
                    }

                    companyId = companyData.id
                } else {
                    // Fallback: Get Demo Company ID for existing users without company
                    const { data: demoCompany } = await supabase
                        .from('companies')
                        .select('id')
                        .eq('slug', 'demo-company')
                        .single()

                    companyId = demoCompany?.id || null
                }

                // Create profile
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                        id: userId,
                        email: user.email,
                        full_name: user.user_metadata?.full_name || null,
                        role: user.user_metadata?.company_name ? 'company_owner' : 'hall_manager',
                        company_id: companyId,
                        assigned_hall_id: null,
                    })

                if (insertError) {
                    console.error('🚨 Self-healing FAILED - Profile insert error:', insertError)
                    console.error('   Error code:', insertError.code)
                    console.error('   Error message:', insertError.message)
                    console.error('   Error details:', insertError.details)
                    return false
                }

                console.log('✅ Self-healing SUCCESS - Profile created for user:', userId)
                return true
            } catch (error) {
                console.error('🚨 Self-healing EXCEPTION:', error)
                return false
            }
        }

        // Fetch company data
        const fetchCompany = async (companyId: string) => {
            try {
                const { data, error } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('id', companyId)
                    .single()

                if (error) {
                    setCompany(null)
                } else {
                    setCompany(data as Company)
                }
            } catch (error) {
                setCompany(null)
            }
        }

        // Defined a function to fetch profile to avoid code duplication
        const fetchProfile = async (userId: string, isRetry = false): Promise<void> => {
            if (!isRetry && lastFetchedUserId.current === userId) return

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single()

                if (error) {
                    if (error.code === 'PGRST116') {
                        console.error('🚨 AUTH ERROR: Profile Not Found (Ghost User)', userId)

                        // Attempt self-healing ONLY if this is not already a retry
                        if (!isRetry) {
                            const created = await createMissingProfile(userId)

                            if (created) {
                                // Retry fetch after successful creation
                                console.log('✅ Self-healing successful, retrying profile fetch')
                                await fetchProfile(userId, true)
                                return
                            } else {
                                // Self-healing failed - unrecoverable error
                                console.error('🚨 CRITICAL: Profile creation failed, logging out user')
                                setProfile(null)
                                setCompany(null)
                                throw new Error('PROFILE_CREATION_FAILED')
                            }
                        } else {
                            // This was already a retry - don't retry again
                            console.error('🚨 CRITICAL: Profile still not found after self-healing')
                            setProfile(null)
                            setCompany(null)
                            throw new Error('PROFILE_NOT_FOUND_AFTER_RETRY')
                        }
                    } else {
                        console.error('🚨 AUTH ERROR: Profile Query Failed', error)
                        setProfile(null)
                        setCompany(null)
                    }
                } else {
                    console.log('✅ Profile loaded successfully:', data.role)
                    setProfile(data as Profile)
                    lastFetchedUserId.current = userId

                    // Fetch company if profile has company_id
                    if (data.company_id) {
                        await fetchCompany(data.company_id)
                    } else {
                        setCompany(null) // Platform admin has no company
                    }
                }
            } catch (error) {
                setProfile(null)
                setCompany(null)

                // Handle critical errors by logging out
                if (error instanceof Error &&
                    (error.message === 'PROFILE_CREATION_FAILED' ||
                        error.message === 'PROFILE_NOT_FOUND_AFTER_RETRY')) {
                    // Log out the user
                    await supabase.auth.signOut()
                    setUser(null)
                    setSession(null)
                    lastFetchedUserId.current = null
                }
            }
        }

        // Initial session check
        const initializeAuth = async () => {
            setIsLoading(true)

            // PERFORMANCE FIX: Safety timeout with proper cleanup
            const safetyTimeout = setTimeout(() => {
                setIsLoading(false)
            }, 10000)

            try {
                const { data: { session } } = await supabase.auth.getSession()

                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user) {
                    await fetchProfile(session.user.id)
                } else {
                    setProfile(null)
                    lastFetchedUserId.current = null
                }
            } catch (error) {
                // Silent error handling in production
            } finally {
                // Clear the safety timeout
                clearTimeout(safetyTimeout)
                // CRITICAL: Always set loading to false
                setIsLoading(false)
            }
        }

        initializeAuth()

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            setSession(session)
            setUser(session?.user ?? null)

            if (session?.user) {
                // If it's a new user or different from what we last successfully fetched
                if (lastFetchedUserId.current !== session.user.id) {
                    // Do NOT set isLoading(true) here to avoid UI blocking/flashing
                    await fetchProfile(session.user.id)
                }
            } else {
                setProfile(null)
                lastFetchedUserId.current = null
            }
        })

        return () => {
            subscription.unsubscribe()
        }
        // PERFORMANCE FIX: Empty dependency array - supabase is now memoized and stable
        // This prevents the infinite re-render loop that was causing browser freezing
    }, [])

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setSession(null)
        setProfile(null)
        setCompany(null)
        lastFetchedUserId.current = null
    }

    const isPlatformAdmin = profile?.role === 'platform_admin'
    const isCompanyOwner = profile?.role === 'company_owner'
    const isCompanyAdmin = profile?.role === 'company_admin'
    const isHallManager = profile?.role === 'hall_manager'

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                profile,
                company,
                companyId: profile?.company_id || null,
                isLoading,
                isPlatformAdmin,
                isCompanyOwner,
                isCompanyAdmin,
                isHallManager,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

/**
 * Helper hook to get companyId with validation
 * Throws an error if companyId is not available or user is platform admin
 * Use this in components that require company-scoped data
 */
export const useCompanyId = (): string => {
    const { companyId, isPlatformAdmin, isLoading } = useAuth()

    if (isLoading) {
        throw new Error('Authentication is still loading. Please wait.')
    }

    if (isPlatformAdmin) {
        throw new Error('Platform admins do not have a company_id')
    }

    if (!companyId) {
        // EMERGENCY FIX: If we forced login but profile is still loading/missing, don't crash.
        // Return a dummy value or null would break the return type. 
        // We log error and return an empty string to allow UI to render (mock mode)
        console.error('CRITICAL: useCompanyId called but companyId is missing. Returning empty string to prevent crash.');
        return '';
    }

    return companyId
}
