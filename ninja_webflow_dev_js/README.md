# Webflow Backend Integration - Local Development

This folder contains the local development setup for integrating the Ninja Backend with Webflow.

## 📁 Structure

```
ninja_webflow_dev_js/
├── index.html              # Local test page
├── js/
│   ├── api-client.js       # Backend API communication
│   ├── property-filters.js # Filtering logic
│   ├── property-sorter.js  # Sorting logic
│   └── app.js              # Main application
├── webflow/
│   └── milestone1-filters-sorting.js  # Webflow-ready code
└── README.md               # This file
```

## 🚀 Getting Started

### 1. Start Your Backend

Make sure your Ninja Backend is running:

```bash
cd ../ninja_backend
npm run start:dev
```

The backend should be running at `http://localhost:3000`

### 2. Open Local Test Page

Open `index.html` in your browser. You can use a simple HTTP server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Then open http://localhost:8000/index.html
```

### 3. Authenticate

Before properties can load, you need to authenticate. Open the browser console and run:

```javascript
// Login with your credentials
app.login('your-email@example.com', 'your-password')
```

Or manually set tokens if you have them:

```javascript
app.apiClient.setTokens('your-access-token', 'your-refresh-token')
```

### 4. Test Filters & Sorting

- Use the filter controls to test price range, bedrooms, bathrooms
- Test sorting by newest, price (low→high, high→low), and distance
- For distance sorting, set a user location first

## 🎯 Milestone 1: Filters & Sorting

### Features Implemented

✅ **Sorting:**
- Newest first (by createdAt/publishedAt)
- Price: Low → High
- Price: High → Low
- Distance (requires user location)

✅ **Filters:**
- Price range (min/max)
- Bedrooms (minimum)
- Bathrooms (minimum)
- Property type (sale/rent)
- Status (published/draft)

### How It Works

1. **API Client** (`api-client.js`):
   - Handles authentication (JWT tokens)
   - Manages token refresh
   - Makes API calls to backend

2. **Property Filters** (`property-filters.js`):
   - Filters properties client-side based on criteria
   - Works with existing property fields

3. **Property Sorter** (`property-sorter.js`):
   - Sorts properties by various criteria
   - Calculates distance using Haversine formula

4. **Main App** (`app.js`):
   - Coordinates everything
   - Handles UI updates
   - Manages event listeners

## 🌐 Webflow Integration

### Step 1: Copy Code to Webflow

1. Open your Webflow project
2. Go to Project Settings → Custom Code
3. Add the code from `webflow/milestone1-filters-sorting.js` to the **Footer Code** (before `</body>`)

### Step 2: Configure

Update the `API_BASE_URL` in the code:

```javascript
const CONFIG = {
  API_BASE_URL: 'https://your-backend.onrender.com/api', // Your production backend URL
  STORAGE_PREFIX: 'ninja_',
};
```

### Step 3: Set Up Webflow Elements

Your Webflow page needs elements with these IDs or classes:

**Required:**
- Properties container: `#propertiesContainer` or `.properties-container`
- Sort dropdown: `#sortBy` or `.sort-by`

**Optional Filters:**
- Price min: `#priceMin` or `.price-min`
- Price max: `#priceMax` or `.price-max`
- Bedrooms: `#bedrooms` or `.bedrooms`
- Bathrooms: `#bathrooms` or `.bathrooms`
- Property type: `#propertyType` or `.property-type`
- Status: `#status` or `.status`

### Step 4: Handle Authentication

You'll need to set up authentication separately (Milestone 2). For now, you can:

1. Set tokens manually via browser console:
```javascript
localStorage.setItem('ninja_access_token', 'your-token');
localStorage.setItem('ninja_refresh_token', 'your-refresh-token');
```

2. Or implement a login flow that calls:
```javascript
window.NinjaPropertyApp.apiClient.login(email, password);
```

### Step 5: Customize Rendering

The `renderProperties()` method triggers a custom event `propertiesFiltered`. You can listen to this in Webflow:

```javascript
document.addEventListener('propertiesFiltered', (event) => {
  const properties = event.detail.properties;
  // Update your Webflow CMS collection or custom elements
  // Example: Update a Webflow collection list
});
```

## 🔧 Development Tips

### Testing Locally

1. Use the local `index.html` for rapid development
2. Test all filter combinations
3. Verify sorting works correctly
4. Test with different data sets

### Debugging

- Open browser console to see logs
- Check Network tab for API calls
- Verify tokens are stored in localStorage
- Test API endpoints directly with Postman/curl

### Common Issues

**Properties not loading:**
- Check authentication tokens
- Verify backend is running
- Check CORS settings in backend
- Verify API_BASE_URL is correct

**Filters not working:**
- Check element IDs/classes match
- Verify event listeners are attached
- Check browser console for errors

**Distance sorting not working:**
- Ensure properties have latitude/longitude
- Set user location first
- Check geocoding if using address input

## 🎯 Milestone 2: Authentication & Roles

### Features Implemented

✅ **Authentication:**
- User signup with role selection
- User login with email/password
- Session management (JWT tokens)
- Token refresh handling
- Logout functionality

✅ **Role-Based Access:**
- Role types: Owner, Agent, Admin, Developer
- Permission checking utilities
- Role-based element visibility
- Route protection helpers

✅ **Session Management:**
- Automatic token refresh
- Session verification
- Persistent login (localStorage)
- Auth state events

### Files Created

- `js/auth-service.js` - Authentication service
- `js/permissions.js` - Permission checking utilities
- `auth-test.html` - Local test page for authentication
- `webflow/milestone2-authentication.js` - Webflow-ready code

### Testing Authentication

1. Open `auth-test.html` in your browser
2. Test signup with different roles
3. Test login/logout
4. Verify session persistence
5. Test permission checks

### Webflow Integration

1. Add `webflow/milestone2-authentication.js` to Webflow Custom Code
2. Use data attributes for role-based visibility:
   ```html
   <!-- Show only when authenticated -->
   <div data-require-auth>Protected Content</div>
   
   <!-- Show only for specific roles -->
   <div data-require-role="owner,admin">Admin Content</div>
   
   <!-- Hide for specific roles -->
   <div data-hide-role="agent">Not for Agents</div>
   ```

3. Use JavaScript API:
   ```javascript
   // Login
   await window.NinjaAuth.login('email@example.com', 'password');
   
   // Check permissions
   window.NinjaPermissions.canViewProperties();
   window.NinjaPermissions.canAccessAdminPanel();
   
   // Protect route
   window.NinjaPermissions.protectRoute(['owner', 'admin'], '/login');
   ```

### Permission Methods

- `canViewProperties()` - Can view property listings
- `canCreateProperties()` - Can create new properties
- `canEditProperties()` - Can edit properties
- `canDeleteProperties()` - Can delete properties (Owner/Admin only)
- `canViewLeads()` - Can view leads
- `canAccessAgentDashboard()` - Can access agent dashboard
- `canAccessAdminPanel()` - Can access admin panel (Admin/Developer only)
- `canManageTeams()` - Can manage teams (Owner/Admin only)
- `canViewAnalytics()` - Can view analytics

## 📝 Next Steps

After Milestone 2 is complete:

1. **Milestone 3**: Agent Dashboard (CRM Core)
   - View assigned listings
   - View incoming leads

2. **Milestone 4**: Lead Assignment Logic
   - Automatic lead routing
   - Agent assignment

3. **Milestone 5**: Subscription Enforcement
   - Feature gating
   - Plan limits

## 🐛 Troubleshooting

### Backend Connection Issues

```javascript
// Test API connection
fetch('http://localhost:3000/api/properties', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### Check Authentication

```javascript
// In browser console
app.apiClient.getCurrentUser()
  .then(user => console.log('Authenticated:', user))
  .catch(err => console.error('Not authenticated:', err));
```

## 📚 API Reference

See `../ninja_backend/API_ENDPOINT_REFERENCE.md` for complete API documentation.

Key endpoints:
- `GET /api/properties` - Get all properties
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/users/me` - Get current user

## 🎨 Customization

The code is modular and can be customized:

- **Styling**: Modify CSS in `index.html` or add Webflow classes
- **Rendering**: Customize `renderProperties()` for your Webflow structure
- **Filters**: Add new filters in `PropertyFilters.filter()`
- **Sorting**: Add new sort options in `PropertySorter.sort()`

---

**Ready to start?** Open `index.html` and begin testing! 🚀
