# Ninja Backend - SaaS-Native Backend

A comprehensive NestJS backend for a real estate SaaS platform.

## Project Structure

This project follows the milestones outlined in `plan.md`:

- **Milestone 1**: Foundation, Environment & Auth
- **Milestone 2**: Core Domain APIs (Teams, Leads, Properties)
- **Milestone 3**: Payments & Subscriptions
- **Milestone 4**: Third-Party Integrations
- **Milestone 5**: Analytics & Reporting
- **Milestone 6**: Frontend Integration & QA
- **Milestone 7**: Deployment & Production Readiness

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
# On Windows (PowerShell)
Copy-Item .env.sample .env

# On Linux/Mac
cp .env.sample .env
```

3. Update `.env` with your configuration values:
   - **Required for Milestone 1**: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
   - Other variables are for future milestones and can be left as placeholders for now

4. Set up the database:
```bash
npm run setup:db
```
   This script will:
   - Automatically create the database if it doesn't exist
   - Run the initial schema migrations
   - Set up all required tables and indexes

5. Run the application:
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Milestone 1 - ✅ Complete

Foundation, Environment & Auth is fully implemented. See [MILESTONE_1.md](./MILESTONE_1.md) for details.

**Features:**
- ✅ PostgreSQL database connection
- ✅ User authentication (signup/login)
- ✅ JWT access & refresh tokens
- ✅ Role-based access control (Owner, Agent, Developer, Admin)
- ✅ Password hashing with bcrypt
- ✅ Protected routes with guards

## Project Structure

```
src/
├── auth/              # Authentication & authorization
├── users/             # User management
├── teams/             # Team & seat management
├── leads/             # Lead management
├── properties/        # Property listings
├── subscriptions/     # Subscription management
├── payments/          # Payment processing (PayPal)
├── integrations/      # Third-party integrations
├── analytics/         # Analytics & reporting
├── help-center/       # Help center articles
├── config/            # Configuration
├── database/          # Database setup
└── main.ts           # Application entry point
```

## API Endpoints

The API is prefixed with `/api` by default.

## Development

- `npm run start:dev` - Start in watch mode
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Lint code

## License

ISC

