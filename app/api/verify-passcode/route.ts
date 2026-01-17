import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { passcode } = body

        console.log('Passcode received:', passcode ? '[HIDDEN]' : 'empty')

        const validPasscode = process.env.CERREX_PASSCODE || 'nuclear2024'

        console.log('Valid passcode from env:', validPasscode ? '[SET]' : 'using default')

        if (passcode === validPasscode) {
            const response = NextResponse.json({ success: true })

            // Set cookie to remember passcode verification
            response.cookies.set('cerrex_passcode', 'verified', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/',
            })

            console.log('Passcode verified successfully')
            return response
        }

        console.log('Invalid passcode attempt')
        return NextResponse.json({ success: false, error: 'Invalid passcode' }, { status: 401 })
    } catch (error) {
        console.error('Error in verify-passcode:', error)
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
    }
}

