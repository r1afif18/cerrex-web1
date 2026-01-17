import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// This route handles AI chat requests with project context injection
// Powered by Google Gemini 1.5 Flash (Free Tier: 1500 req/day)
export async function POST(req: NextRequest) {
    try {
        const { messages, projectId } = await req.json()
        console.log('AI Request:', { projectId, messageCount: messages?.length })

        const supabase = await createClient()

        // 1. Fetch Project Context
        let projectContext = ""
        if (projectId) {
            const { data: project } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single()

            if (project) {
                // Fetch related data for summarization
                const [{ data: uf }, { data: rnd }, { data: inv }] = await Promise.all([
                    supabase.from('unit_factors').select('*').eq('project_id', projectId),
                    supabase.from('radionuclides').select('*').eq('project_id', projectId),
                    supabase.from('inventory_items').select('*').eq('project_id', projectId)
                ])

                projectContext = `
You are CERREX Intelligence, a specialized AI assistant for nuclear facility decommissioning cost estimation.

**Current Project Context:**
- Project Name: ${project.name}
- Description: ${project.description || 'N/A'}

**Data Summary:**
- Unit Factors: ${uf?.length || 0} entries
- Radionuclides: ${rnd?.length || 0} entries  
- Inventory Items: ${inv?.length || 0} items

**Your Expertise:**
- ISDC (International Structure for Decommissioning Costing) standards
- Nuclear facility inventory categorization (D&D, Waste Management)
- Work Difficulty Factors (WDF) calculation
- Manpower and cost estimation methodologies
- Radionuclide handling and decay calculations

Always provide accurate, professional responses based on the project data. If asked for calculations, show your work step by step.
`
            }
        }

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            console.error('AI Route Error: GEMINI_API_KEY is missing')
            return NextResponse.json({ error: "AI Service Not Configured (Missing GEMINI_API_KEY)" }, { status: 500 })
        }

        console.log('Calling Gemini 2.0 Flash-Lite API...')

        // Build conversation history for Gemini format
        const userQuestion = messages[messages.length - 1].content

        // 2. Call Gemini API (using gemini-2.0-flash-lite - free tier)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: projectContext + "\n\nUser Question: " + userQuestion }]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2000,
                }
            })
        })

        const data = await response.json()
        console.log('Gemini API Response Status:', response.status)

        if (!response.ok) {
            console.error('Gemini API Error Detail:', data)
            return NextResponse.json({ error: `Gemini API Error: ${data.error?.message || response.statusText}` }, { status: response.status })
        }

        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that request."
        console.log('AI Response generated successfully')

        return NextResponse.json({
            role: 'assistant',
            content: aiResponse
        })

    } catch (error: any) {
        console.error('AI Route Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
