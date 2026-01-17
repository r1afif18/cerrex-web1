// Generate Prisma Client

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function generatePrismaClient() {
    console.log('Generating Prisma Client...')

    try {
        const { stdout, stderr } = await execAsync('npx prisma generate')
        console.log(stdout)
        if (stderr) console.error(stderr)

        console.log('✅ Prisma Client generated successfully!')
    } catch (error) {
        console.error('❌ Error generating Prisma Client:', error)
        process.exit(1)
    }
}

generatePrismaClient()
