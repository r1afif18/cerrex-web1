// API route for Currencies CRUD operations - Using Supabase

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET all currencies
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: currencies, error } = await supabase
            .from('currencies')
            .select('*')
            .order('code', { ascending: true })

        if (error) throw error

        return NextResponse.json(currencies)
    } catch (error) {
        console.error('Error fetching currencies:', error)
        return NextResponse.json({ error: 'Failed to fetch currencies' }, { status: 500 })
    }
}

// POST new currency
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        const { data: currency, error } = await supabase
            .from('currencies')
            .insert({
                code: body.code,
                name: body.name,
                symbol: body.symbol,
                exchange_rate_to_ref: body.exchangeRateToRef,
                is_reference: body.isReference || false,
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(currency, { status: 201 })
    } catch (error) {
        console.error('Error creating currency:', error)
        return NextResponse.json({ error: 'Failed to create currency' }, { status: 500 })
    }
}

// PUT update currency
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        const { data: currency, error } = await supabase
            .from('currencies')
            .update({
                code: body.code,
                name: body.name,
                symbol: body.symbol,
                exchange_rate_to_ref: body.exchangeRateToRef,
                is_reference: body.isReference,
            })
            .eq('id', body.id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(currency)
    } catch (error) {
        console.error('Error updating currency:', error)
        return NextResponse.json({ error: 'Failed to update currency' }, { status: 500 })
    }
}

// DELETE currency
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Currency ID required' }, { status: 400 })
        }

        const { error } = await supabase
            .from('currencies')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting currency:', error)
        return NextResponse.json({ error: 'Failed to delete currency' }, { status: 500 })
    }
}
