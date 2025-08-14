# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server
npm run dev          # Start Next.js development server on http://localhost:3000

# Build and deployment
npm run build        # Build application for production
npm run start        # Start production server
npm run lint         # Run ESLint checks
```

## Database Commands

```bash
# Prisma database operations
npx prisma generate  # Generate Prisma client after schema changes
npx prisma db push   # Push schema changes to database
npx prisma migrate dev  # Create and apply new migration
npx prisma studio    # Open Prisma Studio for database inspection
```

## Project Architecture

This is a **Next.js 15** application with **App Router** for a "monotributista" (Argentine tax regime) management system.

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **UI**: Radix UI components with Tailwind CSS v4
- **State Management**: TanStack Query (React Query) for server state
- **Authentication**: JWT tokens stored in cookies
- **Forms**: React Hook Form with Zod validation
- **Drag & Drop**: dnd-kit for sortable interfaces

### Key Architecture Patterns

**Authentication Flow:**
- JWT tokens stored in HTTP-only cookies
- Middleware protection at `/middleware.ts:22` for `/dashboard/*` routes
- Server-side user validation in dashboard layout at `app/dashboard/layout.tsx:10`

**Data Layer:**
- Prisma schema defines business entities: User, Producto, Proveedor, Compra, Venta, etc.
- React Query with 5-minute stale time configured in `lib/react-query/options.ts:4`
- Mutations organized by entity in `lib/react-query/mutations/`
- Queries organized by entity in `lib/react-query/queries/`

**UI Architecture:**
- Dashboard layout with collapsible sidebar using ShadCN Sidebar component
- Theme system with light/dark mode and multiple color schemes
- Responsive design with container queries (`@container/main`)
- Component-driven modals for CRUD operations

### Database Schema Structure

The application manages:
- **Financial tracking**: Ingresos (income), Egresos (expenses), with categorization
- **Inventory**: Productos with stock management
- **Purchases**: Compras linked to Proveedores with CompraProducto junction table
- **Sales**: Ventas with VentaProducto for product sales and VentaServicio for services
- **Movement tracking**: Movimiento table that links to all transaction types
- **User isolation**: All entities are user-scoped via userId foreign keys

### File Organization

```
app/
├── api/              # Next.js API routes
├── dashboard/        # Protected dashboard pages
│   ├── layout.tsx    # Dashboard-specific layout with auth
│   ├── categorias/   # Category management
│   ├── productos/    # Product management  
│   ├── proveedores/  # Supplier management
│   └── compras/      # Purchase management
├── login/           # Authentication page
└── layout.tsx       # Root layout with providers

lib/
├── react-query/     # TanStack Query setup
├── server/          # Server-side utilities
└── validators/      # Zod validation schemas

components/
├── ui/              # ShadCN UI components
├── layout/          # Layout components
└── [entity]/        # Entity-specific components
```

### Environment Setup

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string for Prisma

### Development Workflow

1. Database changes: Update `prisma/schema.prisma`, then run `npx prisma db push`
2. New features: Follow the existing pattern of API routes + React Query hooks + UI components
3. Authentication: Protected routes automatically redirect via middleware
4. Styling: Uses Tailwind CSS v4 with CSS variables for theming