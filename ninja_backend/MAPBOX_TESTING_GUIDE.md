# Mapbox Integration - Postman Testing Guide

## Prerequisites

1. **Get JWT Token** - All Mapbox endpoints require authentication
2. **Configure Mapbox Token** - Add `MAPBOX_ACCESS_TOKEN` to your `.env` file
3. **Server Running** - Ensure your backend is running on `http://localhost:3000`

## Step 1: Get Authentication Token

### Login Request
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "user": { ... },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Copy the `accessToken`** - you'll need it for all Mapbox requests.

---

## Step 2: Test Geocoding (Address → Coordinates)

### Endpoint
```
POST http://localhost:3000/api/integrations/mapbox/geocode
```

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

### Request Body
```json
{
  "address": "1600 Amphitheatre Parkway, Mountain View, CA"
}
```

### Sample Test Cases

**Test Case 1: Full Address**
```json
{
  "address": "1600 Amphitheatre Parkway, Mountain View, CA 94043"
}
```

**Test Case 2: City and State**
```json
{
  "address": "New York, NY"
}
```

**Test Case 3: Landmark**
```json
{
  "address": "Times Square, New York"
}
```

**Test Case 4: International Address**
```json
{
  "address": "10 Downing Street, London, UK"
}
```

### Expected Response (Success)
```json
{
  "success": true,
  "data": {
    "latitude": 37.4224764,
    "longitude": -122.0842499,
    "formattedAddress": "1600 Amphitheatre Parkway, Mountain View, CA 94043, United States",
    "placeName": "Amphitheatre Parkway"
  }
}
```

### Expected Response (Not Found)
```json
{
  "success": false,
  "message": "Address not found"
}
```

---

## Step 3: Test Reverse Geocoding (Coordinates → Address)

### Endpoint
```
POST http://localhost:3000/api/integrations/mapbox/reverse-geocode
```

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

### Request Body
```json
{
  "latitude": 37.4224764,
  "longitude": -122.0842499
}
```

### Sample Test Cases

**Test Case 1: Google Headquarters**
```json
{
  "latitude": 37.4224764,
  "longitude": -122.0842499
}
```

**Test Case 2: Times Square, NYC**
```json
{
  "latitude": 40.758896,
  "longitude": -73.985130
}
```

**Test Case 3: Eiffel Tower, Paris**
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351
}
```

**Test Case 4: Sydney Opera House**
```json
{
  "latitude": -33.856784,
  "longitude": 151.213108
}
```

### Expected Response (Success)
```json
{
  "success": true,
  "data": {
    "address": "1600 Amphitheatre Parkway, Mountain View, CA 94043, United States",
    "city": "Mountain View",
    "state": "California",
    "zipCode": "94043",
    "country": "United States",
    "formattedAddress": "1600 Amphitheatre Parkway, Mountain View, CA 94043, United States"
  }
}
```

### Expected Response (Not Found)
```json
{
  "success": false,
  "message": "Location not found"
}
```

---

## Step 4: Test Location Search

### Endpoint
```
GET http://localhost:3000/api/integrations/mapbox/search?q=SEARCH_QUERY&lat=LATITUDE&lng=LONGITUDE
```

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Query Parameters
- `q` (required) - Search query
- `lat` (optional) - Latitude for proximity search
- `lng` (optional) - Longitude for proximity search

### Sample Test Cases

**Test Case 1: Simple Search**
```
GET http://localhost:3000/api/integrations/mapbox/search?q=coffee shop
```

**Test Case 2: Search with Proximity**
```
GET http://localhost:3000/api/integrations/mapbox/search?q=restaurant&lat=40.758896&lng=-73.985130
```

**Test Case 3: City Search**
```
GET http://localhost:3000/api/integrations/mapbox/search?q=San Francisco
```

**Test Case 4: Property Type Search**
```
GET http://localhost:3000/api/integrations/mapbox/search?q=apartment building
```

### Expected Response (Success)
```json
{
  "success": true,
  "data": [
    {
      "id": "poi.123456",
      "placeName": "Starbucks, 123 Main St, New York, NY 10001",
      "text": "Starbucks",
      "center": [-73.985130, 40.758896],
      "context": [...]
    },
    {
      "id": "poi.789012",
      "placeName": "Coffee Shop, 456 Broadway, New York, NY 10002",
      "text": "Coffee Shop",
      "center": [-73.984567, 40.759123],
      "context": [...]
    }
  ]
}
```

---

## Postman Collection Setup

### 1. Create Environment Variables

In Postman, create an environment with:
- `base_url`: `http://localhost:3000/api`
- `access_token`: (set after login)

### 2. Create Collection: "Mapbox Integration"

#### Request 1: Login (to get token)
- **Method**: POST
- **URL**: `{{base_url}}/auth/login`
- **Body** (raw JSON):
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
- **Tests Tab** (to auto-save token):
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("access_token", response.accessToken);
}
```

#### Request 2: Geocode Address
- **Method**: POST
- **URL**: `{{base_url}}/integrations/mapbox/geocode`
- **Headers**:
  - `Authorization`: `Bearer {{access_token}}`
  - `Content-Type`: `application/json`
- **Body** (raw JSON):
```json
{
  "address": "1600 Amphitheatre Parkway, Mountain View, CA"
}
```

#### Request 3: Reverse Geocode
- **Method**: POST
- **URL**: `{{base_url}}/integrations/mapbox/reverse-geocode`
- **Headers**:
  - `Authorization`: `Bearer {{access_token}}`
  - `Content-Type`: `application/json`
- **Body** (raw JSON):
```json
{
  "latitude": 37.4224764,
  "longitude": -122.0842499
}
```

#### Request 4: Search Location
- **Method**: GET
- **URL**: `{{base_url}}/integrations/mapbox/search?q=coffee shop`
- **Headers**:
  - `Authorization`: `Bearer {{access_token}}`

#### Request 5: Search with Proximity
- **Method**: GET
- **URL**: `{{base_url}}/integrations/mapbox/search?q=restaurant&lat=40.758896&lng=-73.985130`
- **Headers**:
  - `Authorization`: `Bearer {{access_token}}`

---

## Common Issues & Solutions

### Issue 1: "Unauthorized" Error
**Solution**: 
- Make sure you're including the `Authorization` header
- Verify your token is still valid (tokens expire after 15 minutes)
- Re-login to get a new token

### Issue 2: "Address not found" or "Location not found"
**Solution**:
- Try a more specific address
- Use full addresses with city and state
- Check if Mapbox token is configured in `.env`

### Issue 3: "MAPBOX_ACCESS_TOKEN not configured"
**Solution**:
- Add `MAPBOX_ACCESS_TOKEN=your_token` to your `.env` file
- Restart your dev server
- Get token from [Mapbox Account](https://account.mapbox.com/)

### Issue 4: Timeout Errors
**Solution**:
- Check your internet connection
- Verify Mapbox API is accessible
- Check server logs for detailed error messages

---

## Quick Test Checklist

- [ ] Server is running on port 3000
- [ ] `MAPBOX_ACCESS_TOKEN` is set in `.env`
- [ ] User account exists and can login
- [ ] JWT token obtained from login
- [ ] Geocode endpoint works with sample address
- [ ] Reverse geocode endpoint works with coordinates
- [ ] Search endpoint returns results

---

## Sample Coordinates for Testing

| Location | Latitude | Longitude |
|----------|----------|-----------|
| Google HQ | 37.4224764 | -122.0842499 |
| Times Square | 40.758896 | -73.985130 |
| Eiffel Tower | 48.858844 | 2.294351 |
| Sydney Opera | -33.856784 | 151.213108 |
| Statue of Liberty | 40.689247 | -74.044502 |

---

## Expected Response Times

- **Geocode**: 200-500ms
- **Reverse Geocode**: 200-500ms
- **Search**: 300-800ms

If responses are slower, check:
- Network connection
- Mapbox API status
- Server logs for errors

