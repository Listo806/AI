# AI-Listo CRM Setup & Deployment

## Features Implemented

✅ Authentication (Sign In / Sign Up)
✅ Protected Routes
✅ Owner Dashboard with:
   - Stats (Total Properties, Published Properties, Total Leads, New Leads)
   - Properties List (read-only)
   - Leads List (read-only)
✅ Role-based routing
✅ Token management with auto-refresh
✅ Sidebar with user info and logout

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   Create a `.env` file:
   ```
   VITE_API_BASE_URL=https://ai-2-7ikc.onrender.com/api
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Deployment to Netlify

1. **Connect Repository**
   - Push code to GitHub/GitLab
   - Connect repository to Netlify

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment variables: Add `VITE_API_BASE_URL` if needed

3. **Deploy**
   - Netlify will auto-deploy on push
   - Or manually trigger deployment

## Webflow Redirect Setup

In Webflow, add a redirect rule:
- From: `/dashboard/owners` (or your dashboard path)
- To: `https://your-netlify-site.netlify.app/dashboard/owners`
- Status: 302 (Temporary) or 301 (Permanent)

Or use JavaScript redirect:
```javascript
if (window.location.pathname === '/dashboard/owners') {
  window.location.href = 'https://your-netlify-site.netlify.app/dashboard/owners';
}
```

## API Endpoints Used

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `GET /api/crm/dashboard/summary` - Dashboard stats
- `GET /api/crm/owner/properties` - Owner properties list
- `GET /api/crm/owner/leads` - Owner leads list
- `GET /api/users/me` - Current user info

## Project Structure

```
src/
├── api/
│   └── apiClient.js          # API client with token management
├── components/
│   ├── ProtectedRoute.jsx    # Route protection component
│   └── Sidebar.jsx           # Sidebar navigation
├── context/
│   └── AuthContext.jsx      # Authentication context
├── layouts/
│   └── DashboardLayout.jsx  # Dashboard layout wrapper
├── pages/
│   ├── auth/
│   │   ├── SignIn.jsx        # Sign in page
│   │   ├── SignUp.jsx        # Sign up page
│   │   └── Auth.css          # Auth page styles
│   └── dashboard/
│       └── Dashboard.jsx    # Owner dashboard
├── styles/
│   └── crm-dashboard.css     # Dashboard styles
├── theme/
│   └── ThemeProvider.jsx    # Theme provider
├── App.jsx                   # Main app component
└── main.jsx                  # Entry point
```

## Notes

- All authentication is handled via JWT tokens
- Tokens are stored in localStorage with prefix `listo_`
- Auto token refresh on 401 errors
- Role-based dashboard routing
- Owner-only endpoints enforce role checking
