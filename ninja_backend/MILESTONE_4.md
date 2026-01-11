# Milestone 4 - Third-Party Integrations

## Scope

This milestone implements third-party integrations to enhance the platform's capabilities:

- **Mapbox Integration** - Geocoding and location features for properties
- **WhatsApp API** - Messaging capabilities (API-level only)
- **AI Assistant** - Backend endpoints for AI-powered features
- **Push Notifications** - Web/PWA push notification support
- **Cloud Storage** - File upload and media management

## Architecture

All integrations are isolated via service wrappers in the `integrations` module, ensuring:
- Easy swapping of providers
- Consistent error handling
- Non-blocking core flows
- Graceful degradation if services are unavailable

---

## 1. Mapbox Integration

### Features
- **Geocoding**: Convert addresses to coordinates (lat/lng)
- **Reverse Geocoding**: Convert coordinates to addresses
- **Map Features**: Support for property location visualization
- **Search**: Location-based property search

### Implementation
- Service: `src/integrations/mapbox/mapbox.service.ts`
- Controller: `src/integrations/mapbox/mapbox.controller.ts`
- Integration with Properties module for automatic geocoding

### Environment Variables
```env
MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

### API Endpoints
- `POST /api/integrations/mapbox/geocode` - Geocode an address
- `POST /api/integrations/mapbox/reverse-geocode` - Reverse geocode coordinates
- `GET /api/integrations/mapbox/search` - Search locations

---

## 2. WhatsApp API Integration

### Features
- **Send Messages**: Send text messages via WhatsApp Business API
- **Message Templates**: Support for template messages
- **Status Tracking**: Track message delivery status

### Implementation
- Service: `src/integrations/whatsapp/whatsapp.service.ts`
- Controller: `src/integrations/whatsapp/whatsapp.controller.ts`
- Integration with Leads module for lead communication

### Environment Variables
```env
WHATSAPP_PHONE_ID=your_phone_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_API_VERSION=v18.0
```

### API Endpoints
- `POST /api/integrations/whatsapp/send` - Send a message
- `POST /api/integrations/whatsapp/send-template` - Send template message
- `GET /api/integrations/whatsapp/status/:messageId` - Get message status

---

## 3. AI Assistant Backend

### Features
- **Chat Endpoints**: AI-powered chat for property recommendations
- **Lead Analysis**: AI analysis of leads
- **Property Suggestions**: AI property suggestions based on criteria

### Implementation
- Service: `src/integrations/ai/ai-assistant.service.ts`
- Controller: `src/integrations/ai/ai-assistant.controller.ts`
- Configurable AI provider (OpenAI, Anthropic, etc.)

### Environment Variables
```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key
# OR
ANTHROPIC_API_KEY=your_anthropic_key
```

### API Endpoints
- `POST /api/integrations/ai/chat` - Chat with AI assistant
- `POST /api/integrations/ai/analyze-lead` - Analyze a lead
- `POST /api/integrations/ai/suggest-properties` - Get property suggestions

---

## 4. Push Notifications

### Features
- **Web Push**: Browser push notifications
- **PWA Support**: Progressive Web App notifications
- **Notification Management**: Subscribe/unsubscribe endpoints
- **Notification Sending**: Send notifications to users

### Implementation
- Service: `src/integrations/notifications/push-notification.service.ts`
- Controller: `src/integrations/notifications/push-notification.controller.ts`
- Database table for subscription management

### Environment Variables
```env
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your-email@example.com
```

### API Endpoints
- `POST /api/integrations/notifications/subscribe` - Subscribe to push notifications
- `POST /api/integrations/notifications/unsubscribe` - Unsubscribe
- `POST /api/integrations/notifications/send` - Send notification (admin)

---

## 5. Cloud Storage

### Features
- **File Upload**: Upload files (images, documents, videos)
- **File Management**: List, delete, update files
- **Multiple Providers**: Support for AWS S3, Cloudinary, etc.
- **Property Media**: Integration with properties module

### Implementation
- Service: `src/integrations/storage/storage.service.ts`
- Controller: `src/integrations/storage/storage.controller.ts`
- Provider abstraction for multiple storage backends

### Environment Variables
```env
STORAGE_PROVIDER=s3
# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name

# OR Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### API Endpoints
- `POST /api/integrations/storage/upload` - Upload a file
- `GET /api/integrations/storage/files` - List files
- `DELETE /api/integrations/storage/files/:id` - Delete a file
- `GET /api/integrations/storage/files/:id` - Get file URL

---

## Integration Isolation

All integrations follow a consistent pattern:

1. **Service Layer**: Abstracted service with provider-specific implementations
2. **Error Handling**: Graceful degradation if services are unavailable
3. **Non-Blocking**: Core flows continue even if integrations fail
4. **Configuration**: Environment-based provider selection

### Example Structure
```
integrations/
├── mapbox/
│   ├── mapbox.service.ts
│   ├── mapbox.controller.ts
│   └── mapbox.module.ts
├── whatsapp/
│   ├── whatsapp.service.ts
│   ├── whatsapp.controller.ts
│   └── whatsapp.module.ts
├── ai/
│   ├── ai-assistant.service.ts
│   ├── ai-assistant.controller.ts
│   └── ai-assistant.module.ts
├── notifications/
│   ├── push-notification.service.ts
│   ├── push-notification.controller.ts
│   └── push-notification.module.ts
└── storage/
    ├── storage.service.ts
    ├── storage.controller.ts
    └── storage.module.ts
```

---

## Database Schema

### Push Notification Subscriptions
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
```

---

## Exit Criteria

✅ **All integrations live**
- Mapbox integration functional
- WhatsApp API working
- AI assistant endpoints operational
- Push notifications configured
- Cloud storage functional

✅ **No blocking of core flows**
- Integrations fail gracefully
- Core features work without integrations
- Error handling prevents crashes
- Logging for debugging

---

## Testing

Each integration should be tested:
1. **Happy Path**: Normal operation with valid credentials
2. **Error Handling**: Invalid credentials, network failures
3. **Graceful Degradation**: Core flows work when integration is down
4. **Rate Limiting**: Respect API rate limits

---

## Next Steps (Milestone 5)

- Analytics & Reporting
- Event logging
- Report generation

