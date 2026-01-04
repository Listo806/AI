# Frontend Environment Variables

## Required Variables

### `VITE_API_BASE_URL`
**Description**: Backend API base URL (without `/api` prefix)

**Required**: Yes

**Default**: `http://localhost:3000`

**Examples**:
```bash
# Local development
VITE_API_BASE_URL=http://localhost:3000

# Production
VITE_API_BASE_URL=https://api.yourdomain.com

# Staging
VITE_API_BASE_URL=https://staging-api.yourdomain.com
```

**Note**: The `/api` prefix is automatically appended by `apiClient.js`, so:
- If you set `VITE_API_BASE_URL=http://localhost:3000`
- API calls will go to `http://localhost:3000/api/*`

## Optional Variables

### `VITE_PADDLE_CLIENT_TOKEN` (Optional)
**Description**: Paddle client token for frontend initialization (preferred method)

**Required**: No (but recommended if using Paddle overlay checkout)

**Note**: You can get this token from Paddle Dashboard → Developer Tools → Authentication → Client Tokens. This is the preferred method for initializing Paddle.js.

**Example**:
```bash
VITE_PADDLE_CLIENT_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### `VITE_PADDLE_VENDOR_ID` (Optional)
**Description**: Paddle vendor ID for frontend initialization (alternative to client token)

**Required**: No (fallback if client token is not available)

**Note**: This is an alternative initialization method. The backend can also provide vendor ID via the config status endpoint. Use this if you don't have a client token.

**Example**:
```bash
VITE_PADDLE_VENDOR_ID=12345
```

### `VITE_MAPBOX_ACCESS_TOKEN` (Optional)
**Description**: Mapbox public access token for displaying interactive maps

**Required**: No (but required if you want to use the interactive map feature)

**Note**: This should be a public token (starts with `pk.`) that can be used in the browser. Get it from [Mapbox Account](https://account.mapbox.com/access-tokens/). The backend uses a secret token (starts with `sk.`) which should NOT be used in the frontend.

**Example**:
```bash
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsc...
```

## Example .env File

```bash
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:3000

# Optional: Paddle Client Token (preferred - get from Paddle Dashboard)
VITE_PADDLE_CLIENT_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Paddle Vendor ID (fallback if client token not available)
VITE_PADDLE_VENDOR_ID=12345

# Optional: Mapbox Public Access Token (for interactive maps)
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsc...
```

## How to Use

1. Copy `.env.sample` to `.env`:
   ```bash
   cp .env.sample .env
   ```

2. Update the values in `.env` with your actual backend URL

3. Restart your dev server if it's running:
   ```bash
   npm run dev
   ```

## Important Notes

- All Vite environment variables must be prefixed with `VITE_` to be exposed to the frontend
- Environment variables are embedded at build time, not runtime
- Never commit `.env` files to version control (they're in `.gitignore`)
- For production builds, set environment variables in your hosting platform (Netlify, Vercel, etc.)

