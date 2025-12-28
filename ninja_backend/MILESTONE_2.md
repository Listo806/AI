# Milestone 2 - Core Domain APIs

## ✅ Completed Features

### Teams & Seat Management
- **Team Creation**: Create teams with customizable seat limits
- **Seat Management**: 
  - Track seat usage and availability
  - Automatic seat limit enforcement
  - Add/remove team members
- **Role Enforcement**: Only team owners can manage teams and members
- **Seat Limits**: Automatically deactivate members when seat limit is exceeded

### Leads Module
- **Lead Creation**: Create leads with contact information
- **Lead Assignment**: Assign leads to team members
- **Status Management**: Track lead status (new, contacted, qualified, converted, lost)
- **Team-based Access**: Team members can view all team leads
- **Filtering**: Filter leads by status

### Properties Module
- **Property Creation**: Create properties with detailed information
- **Property Types**: Support for sale and rent properties
- **Status Management**: Draft, published, sold, rented, archived
- **Publishing**: Publish properties with automatic timestamp
- **Media Management**: Add images, videos, and documents to properties
- **Location Data**: Store latitude/longitude for mapping
- **Property Details**: Bedrooms, bathrooms, square feet, lot size, year built

### Server-side Validation & Permissions
- **DTO Validation**: All endpoints use class-validator for input validation
- **Permission Checks**: 
  - Users can only modify their own resources
  - Team members can view team resources
  - Team owners have full team management permissions
- **Seat Enforcement**: Automatic enforcement when seat limits change

## API Endpoints

### Teams
- `POST /api/teams` - Create a new team
- `GET /api/teams` - Get all teams for current user
- `GET /api/teams/:id` - Get team by ID
- `PUT /api/teams/:id` - Update team (owner only)
- `GET /api/teams/:id/seats` - Get seat information
- `POST /api/teams/:id/members/:userId` - Add member to team (owner only)
- `DELETE /api/teams/:id/members/:userId` - Remove member from team (owner only)

### Leads
- `POST /api/leads` - Create a new lead
- `GET /api/leads` - Get all leads (team or user-specific)
- `GET /api/leads?status=new` - Filter leads by status
- `GET /api/leads/:id` - Get lead by ID
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead (creator only)

### Properties
- `POST /api/properties` - Create a new property
- `GET /api/properties` - Get all properties (team or user-specific)
- `GET /api/properties?type=sale&status=published` - Filter properties
- `GET /api/properties/:id` - Get property by ID
- `PUT /api/properties/:id` - Update property
- `POST /api/properties/:id/publish` - Publish property
- `DELETE /api/properties/:id` - Delete property (creator only)
- `POST /api/properties/:id/media` - Add media to property (with validation & permissions)
- `GET /api/properties/:id/media` - Get all media for property (sorted by primary, then order)
- `PUT /api/properties/:id/media/:mediaId` - Update media (set primary, reorder)
- `DELETE /api/properties/:id/media/:mediaId` - Delete media (with permissions)

## Database Schema

### New Tables
- `leads` - Lead management
- `properties` - Property listings
- `property_media` - Media files for properties

### Updated Tables
- `teams` - Already exists (from Milestone 1)

## Setup Instructions

1. **Run Database Migration**
   ```bash
   npm run setup:db
   ```
   This will run both initial schema and Milestone 2 migrations.

2. **Start the Server**
   ```bash
   npm run start:dev
   ```

## Example Usage

### Create a Team
```bash
POST /api/teams
{
  "name": "My Real Estate Team",
  "seatLimit": 5
}
```

### Create a Lead
```bash
POST /api/leads
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "status": "new",
  "source": "website"
}
```

### Create a Property
```bash
POST /api/properties
{
  "title": "Beautiful 3BR House",
  "type": "sale",
  "price": 350000,
  "bedrooms": 3,
  "bathrooms": 2,
  "squareFeet": 1800,
  "address": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zipCode": "62701"
}
```

### Publish a Property
```bash
POST /api/properties/:id/publish
```

### Add Media to Property
```bash
POST /api/properties/:id/media
{
  "url": "https://example.com/image1.jpg",
  "type": "image",
  "isPrimary": true
}
```

### Get All Media for Property
```bash
GET /api/properties/:id/media
```

### Update Media (Set Primary, Reorder)
```bash
PUT /api/properties/:id/media/:mediaId
{
  "isPrimary": true,
  "displayOrder": 1
}
```

### Delete Media
```bash
DELETE /api/properties/:id/media/:mediaId
```

## Media Handling - Complete Workflow Example

Here's a complete example of managing media for a property:

### Step 1: Create a Property
```bash
POST /api/properties
{
  "title": "Beautiful 3BR House",
  "type": "sale",
  "price": 350000,
  "bedrooms": 3,
  "bathrooms": 2,
  "squareFeet": 1800,
  "address": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zipCode": "62701"
}

# Response:
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Beautiful 3BR House",
  ...
}
```

### Step 2: Add Primary Image
```bash
POST /api/properties/550e8400-e29b-41d4-a716-446655440000/media
{
  "url": "https://storage.example.com/properties/main-image.jpg",
  "type": "image",
  "isPrimary": true
}

# Response:
{
  "id": "media-uuid-1",
  "propertyId": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://storage.example.com/properties/main-image.jpg",
  "type": "image",
  "isPrimary": true,
  "displayOrder": 0,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Step 3: Add Additional Images
```bash
POST /api/properties/550e8400-e29b-41d4-a716-446655440000/media
{
  "url": "https://storage.example.com/properties/kitchen.jpg",
  "type": "image",
  "isPrimary": false
}

POST /api/properties/550e8400-e29b-41d4-a716-446655440000/media
{
  "url": "https://storage.example.com/properties/bedroom.jpg",
  "type": "image",
  "isPrimary": false
}
```

### Step 4: Add Video Tour
```bash
POST /api/properties/550e8400-e29b-41d4-a716-446655440000/media
{
  "url": "https://storage.example.com/properties/video-tour.mp4",
  "type": "video",
  "isPrimary": false
}
```

### Step 5: Add Document (Floor Plan)
```bash
POST /api/properties/550e8400-e29b-41d4-a716-446655440000/media
{
  "url": "https://storage.example.com/properties/floor-plan.pdf",
  "type": "document",
  "isPrimary": false
}
```

### Step 6: Get All Media (Sorted)
```bash
GET /api/properties/550e8400-e29b-41d4-a716-446655440000/media

# Response (sorted by primary first, then display order):
[
  {
    "id": "media-uuid-1",
    "url": "https://storage.example.com/properties/main-image.jpg",
    "type": "image",
    "isPrimary": true,
    "displayOrder": 0
  },
  {
    "id": "media-uuid-2",
    "url": "https://storage.example.com/properties/kitchen.jpg",
    "type": "image",
    "isPrimary": false,
    "displayOrder": 1
  },
  {
    "id": "media-uuid-3",
    "url": "https://storage.example.com/properties/bedroom.jpg",
    "type": "image",
    "isPrimary": false,
    "displayOrder": 2
  },
  {
    "id": "media-uuid-4",
    "url": "https://storage.example.com/properties/video-tour.mp4",
    "type": "video",
    "isPrimary": false,
    "displayOrder": 3
  },
  {
    "id": "media-uuid-5",
    "url": "https://storage.example.com/properties/floor-plan.pdf",
    "type": "document",
    "isPrimary": false,
    "displayOrder": 4
  }
]
```

### Step 7: Change Primary Image
```bash
PUT /api/properties/550e8400-e29b-41d4-a716-446655440000/media/media-uuid-2
{
  "isPrimary": true
}

# Note: This automatically unsets the previous primary image
```

### Step 8: Reorder Media
```bash
PUT /api/properties/550e8400-e29b-41d4-a716-446655440000/media/media-uuid-3
{
  "displayOrder": 0
}
```

### Step 9: Delete Media
```bash
DELETE /api/properties/550e8400-e29b-41d4-a716-446655440000/media/media-uuid-5
```

## Media Features

### Supported Media Types
- **`image`**: Photos of the property (JPG, PNG, WebP, etc.)
- **`video`**: Video tours, walkthroughs (MP4, WebM, etc.)
- **`document`**: PDFs, floor plans, brochures, etc.

### Key Features
- **Primary Image Management**: One primary image per property (automatically managed)
  - Setting a new primary automatically unsets the previous one
  - Primary image appears first in the media list
- **Display Ordering**: Control the order media appears
  - Lower `displayOrder` values appear first
  - Media sorted by: primary first, then by display order
- **Automatic Sorting**: Media returned sorted by:
  1. Primary image first (`isPrimary: true`)
  2. Then by `displayOrder` (ascending)
- **Permission Enforcement**: 
  - Only property creator or team members can add/update/delete media
  - Validates user access before any media operation

### Media Validation
- **URL**: Required, must be a valid string
- **Type**: Optional, defaults to `"image"`, must be one of: `"image"`, `"video"`, `"document"`
- **isPrimary**: Optional, defaults to `false`, must be boolean
- **displayOrder**: Optional, defaults to auto-increment, must be integer >= 0

## Exit Criteria Status

✅ **Core APIs functional**
- Teams, Leads, and Properties APIs all implemented
- CRUD operations working
- Filtering and querying supported

✅ **Seat and role enforcement active**
- Seat limits enforced automatically
- Role-based permissions implemented
- Team ownership validation working

## Next Steps (Milestone 3)

- PayPal subscription integration
- Plan mapping and seat-based billing
- Webhook handling
- Automatic seat enforcement via webhooks

