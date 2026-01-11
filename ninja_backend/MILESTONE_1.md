# Milestone 1 - Foundation, Environment & Auth

## ✅ Completed Features

### Database Setup
- PostgreSQL connection configured via `DatabaseService`
- Database schema migration file created (`src/database/migrations/001_initial_schema.sql`)
- Users and Teams tables with proper relationships
- Database setup script: `npm run setup:db`

### Environment Configuration
- Environment variables configured with validation
- `.env.example` file with all required variables
- ConfigService for type-safe environment variable access
- Support for local and staging environments

### Authentication System
- **Signup**: User registration with email, password, and role
- **Login**: Email/password authentication
- **JWT Tokens**: 
  - Access tokens (15min default)
  - Refresh tokens (7 days default)
- **Password Security**: bcrypt hashing with salt rounds
- **Token Refresh**: Endpoint to refresh access tokens

### Role-Based Access Control
- **User Roles**: Owner, Agent, Developer, Admin
- **JWT Auth Guard**: Protects routes requiring authentication
- **Roles Guard**: Enforces role-based permissions
- **Decorators**: 
  - `@Roles()` - Specify required roles for endpoints
  - `@CurrentUser()` - Access authenticated user in controllers

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "role": "owner"
  }
  ```

- `POST /api/auth/login` - Login user
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- `POST /api/auth/refresh` - Refresh access token
  ```json
  {
    "refreshToken": "your-refresh-token"
  }
  ```

### Protected Endpoints
- `GET /api/users/me` - Get current user profile (requires auth)
- `GET /api/users/admin-only` - Admin/Developer only endpoint (requires auth + role)

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   # On Windows (PowerShell)
   Copy-Item .env.sample .env
   
   # On Linux/Mac
   cp .env.sample .env
   
   # Edit .env with your database URL and secrets
   ```

3. **Set Up Database**
   ```bash
   npm run setup:db
   ```
   This script will automatically:
   - Create the database if it doesn't exist
   - Run schema migrations
   - Set up all required tables (users, teams, etc.)
   
   **Note**: Make sure your PostgreSQL server is running and your `DATABASE_URL` has the correct credentials.

4. **Start Development Server**
   ```bash
   npm run start:dev
   ```

## Environment Variables Required

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ninja_db
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
API_PREFIX=api
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

## Testing Authentication

### 1. Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "owner"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Access Protected Route
```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Refresh Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Exit Criteria Status

✅ **Auth works end-to-end**
- Signup, login, and token refresh all functional
- Password hashing and validation working
- JWT tokens generated and validated correctly

✅ **Roles enforced server-side**
- Role-based guards implemented
- Decorators for role enforcement
- Example protected endpoints demonstrate functionality

## Next Steps (Milestone 2)

- Teams & seat management
- Leads module
- Properties module
- Server-side validation & permissions

