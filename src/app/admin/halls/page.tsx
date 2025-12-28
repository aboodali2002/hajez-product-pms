import { createClient } from '@/utils/supabase/server'
import { HallList } from '@/components/admin/HallList'
import { getCompanyHalls } from '@/services/data-service'

export default async function HallsPage() {
    const supabase = await createClient()

    // Get current user's company_id from profile
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <div dir="rtl">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">إدارة القاعات</h1>
                    <p className="text-white/60">يرجى تسجيل الدخول لعرض القاعات.</p>
                </header>
            </div>
        )
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single()

    const companyId = profile?.company_id

    if (!companyId) {
        console.error('No company_id found for user')
        return (
            <div dir="rtl">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">إدارة القاعات</h1>
                    <p className="text-white/60">لم يتم العثور على الشركة.</p>
                </header>
            </div>
        )
    }

    // Use safe data service with company_id filtering
    const halls = await getCompanyHalls(companyId)

    return (
        <div dir="rtl">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">إدارة القاعات</h1>
                <p className="text-white/60">إنشاء وإدارة قاعات الأفراح.</p>
            </header>

            <HallList initialHalls={halls || []} companyId={companyId} />
        </div>
    )
}
