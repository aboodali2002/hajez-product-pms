import { Sidebar } from '@/components/admin/Sidebar'
import { MobileNav } from '@/components/admin/MobileNav'
import RoleGuard from '@/components/auth/RoleGuard'
import { requireRole } from '@/lib/auth'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Server-Side Protection: This prevents data leakage in Server Components
    // await requireRole(['company_owner', 'company_admin'])

    return (
        <RoleGuard allowedRoles={['company_owner', 'company_admin', 'platform_admin']}>
            <div className="min-h-screen bg-black text-white flex">
                {/* Background Effects */}
                <div className="fixed inset-0 -z-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
                    <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px]" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px]" />
                </div>

                <Sidebar />
                <MobileNav />

                <main className="flex-1 mr-0 md:mr-64 p-4 md:p-8 overflow-y-auto h-screen pb-24 md:pb-8">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </RoleGuard>
    )
}
