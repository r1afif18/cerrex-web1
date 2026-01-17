# CERREX Web Application

Nuclear decommissioning cost estimation tool - modernized web version of CERREX-D2 Excel application.

## Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL + Prisma ORM
- **Data Tables:** AG-Grid
- **Charts:** Recharts
- **Excel Processing:** SheetJS (xlsx)
- **Calculations:** math.js

## Features

- ✅ All 17 Excel sheets functionality
- ✅ ISDC-based cost calculations
- ✅ Radioactive decay calculations
- ✅ Waste categorization (IAEA standards)
- ✅ Inventory management
- ✅ Scheduling & cash flow
- ✅ Sensitivity analysis
- ✅ Excel import/export
- ✅ Real-time calculations

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL

# Run database migrations
npx prisma migrate dev

# Seed initial data
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
cerrex-web/
├── app/                    # Next.js app directory
│   ├── (dashboard)/        # Dashboard routes
│   ├── api/                # API routes
│   ├── generated/          # Prisma client
│   └── layout.tsx          # Root layout
├── components/             # Reusable components
│   ├── sheets/             # Sheet-specific components  
│   └── ui/                 # UI primitives
├── lib/                    # Utility functions
│   ├── calculations/       # Calculation engines
│   ├── excel/              # Excel import/export
│   └── prisma.ts           # Prisma client
├── prisma/                 # Database schema
│   ├── migrations/         # Migration files
│   └── schema.prisma       # Prisma schema
└── public/                 # Static assets
```

## Database Schema

The database schema covers all 17 Excel sheets:

- Projects & metadata
- Lists (currencies, categories, systems)
- Unit Factors (UF)
- Radionuclides (RND)
- Inventory (INV, BLD, ADIN)
- ISDC calculations
- Scheduling (SCHDL)
- And more...

See `prisma/schema.prisma` for complete schema.

## Development

```bash
# Run dev server
npm run dev

# Run type checking
npm run type-check

# Format code
npm run format

# Lint
npm run lint

# Prisma Studio (DB GUI)
npx prisma studio
```

## Calculation Accuracy

All calculations are ported from the original Excel file to ensure **100% accuracy**:

- Radioactive decay: `N(t) = N0 * exp(-λt)`
- ISDC cost categories
- Waste categorization logic
- Multi-level IF statements
- VLOOKUP equivalent queries

## License

Proprietary - For authorized use only.

## Contact

For questions or support, contact the development team.
