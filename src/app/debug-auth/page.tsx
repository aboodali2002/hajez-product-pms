'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

export default function DebugAuthPage() {
    const supabase = createClient()
    const [logs, setLogs] = useState<string[]>([])
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<any>(null)

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].slice(0, 8)}: ${msg}`])

    useEffect(() => {
        const runDiagnostics = async () => {
            addLog('Starting Diagnostics...')

            // 1. Check Session
            addLog('Step 1: Check Session...')
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError) {
                addLog(`ERROR: Session check failed - ${sessionError.message}`)
                return
            }

            if (!session) {
                addLog('WARNING: No active session found. You are logged out.')
                return
            }

            addLog(`SUCCESS: Session found for User ID: ${session.user.id}`)
            setUser(session.user)

            // 2. Check User (Server side verification equivalent)
            addLog('Step 2: Verify User...')
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError || !user) {
                addLog(`ERROR: getUser() failed - ${userError?.message}`)
            } else {
                addLog('SUCCESS: User verified.')
            }

            // 3. Check Profile (RLS Test)
            addLog('Step 3: Fetch Profile (RLS Test)...')
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

            if (profileError) {
                addLog(`CRITICAL FAIL: Profile fetch failed. Code: ${profileError.code}. Message: ${profileError.message}`)
                addLog('HINT: This usually means RLS policies are blocking you, or the row does not exist.')
            } else {
                addLog(`SUCCESS: Profile found. Role: ${profile.role}`)
                setProfile(profile)
            }

            addLog('Diagnostics Complete.')
        }

        runDiagnostics()
    }, [supabase])

    return (
        <div className="p-8 bg-black min-h-screen text-green-400 font-mono text-sm">
            <h1 className="text-xl font-bold text-white mb-4">Auth Diagnostics</h1>

            <div className="border border-green-800 p-4 rounded bg-green-900/10 mb-6">
                <h2 className="text-white mb-2">Current State</h2>
                <p>User: {user ? user.email : 'None'}</p>
                <p>Profile Role: {profile?.role || 'None'}</p>
            </div>

            <div className="space-y-1">
                {logs.map((log, i) => (
                    <div key={i} className="border-b border-green-900/30 pb-1">{log}</div>
                ))}
            </div>

            <button
                onClick={() => window.location.href = '/login'}
                className="mt-8 px-4 py-2 bg-white text-black font-bold rounded hover:bg-gray-200"
            >
                Back to Login
            </button>
        </div>
    )
}
