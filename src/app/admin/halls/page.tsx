import { createClient } from '@/utils/supabase/server'
import { HallList } from '@/components/admin/HallList'

export default async function HallsPage() {
    const supabase = await createClient()

    const { data: halls } = await supabase
        .from('halls')
        .select('*')
        .order('created_at', { ascending: true })

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Halls Management</h1>
                <p className="text-white/60">Create and manage your wedding halls.</p>
            </header>

            <HallList initialHalls={halls || []} />
        </div>
    )
}
