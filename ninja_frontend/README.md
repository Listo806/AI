# Ninja Frontend

Minimal frontend for testing backend APIs end-to-end.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.sample .env
```

3. Update `.env` with your backend URL (the `/api` prefix is automatically added):
```
VITE_API_BASE_URL=http://localhost:3000
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Features

- **Authentication**: Login/Signup
- **Dashboard**: Overview of subscriptions, teams, leads, properties
- **Subscriptions**: View plans, create subscriptions, view current subscriptions
- **Teams**: Create and view teams
- **Leads**: Create and view leads
- **Properties**: Create and view properties

## Pages

- `/login` - Login page
- `/signup` - Signup page
- `/` - Dashboard
- `/subscriptions` - Subscription management
- `/subscription/success` - Payment success page
- `/teams` - Team management
- `/leads` - Lead management
- `/properties` - Property management

