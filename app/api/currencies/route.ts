// API route for Currencies CRUD operations

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET all currencies
export async function GET() {
    try {
        const currencies = await prisma.currency.findMany({
            orderBy: { code: 'asc' }
        })

        return NextResponse.json(currencies)
    } catch (error) {
        console.error('Error fetching currencies:', error)
        return NextResponse.json({ error: 'Failed to fetch currencies' }, { status: 500 })
    }
}

// POST new currency
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const currency = await prisma.currency.create({
            data: {
                code: body.code,
                name: body.name,
                symbol: body.symbol,
                exchangeRateToRef: body.exchangeRateToRef,
                isReference: body.isReference || false,
            }
        })

        return NextResponse.json(currency, { status: 201 })
    } catch (error) {
        console.error('Error creating currency:', error)
        return NextResponse.json({ error: 'Failed to create currency' }, { status: 500 })
    }
}

// PUT update currency
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()

        const currency = await prisma.currency.update({
            where: { id: body.id },
            data: {
                code: body.code,
                name: body.name,
                symbol: body.symbol,
                exchangeRateToRef: body.exchangeRateToRef,
                isReference: body.isReference,
            }
        })

        return NextResponse.json(currency)
    } catch (error) {
        console.error('Error updating currency:', error)
        return NextResponse.json({ error: 'Failed to update currency' }, { status: 500 })
    }
}

// DELETE currency
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Currency ID required' }, { status: 400 })
        }

        await prisma.currency.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting currency:', error)
        return NextResponse.json({ error: 'Failed to delete currency' }, { status: 500 })
    }
}
