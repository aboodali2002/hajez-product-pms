import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // PASS-THROUGH DEBUG MODE
    // We are deliberately skipping Supabase Auth for one deployment
    // to confirm if the 500 error is caused by the edge runtime crashing.
    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
