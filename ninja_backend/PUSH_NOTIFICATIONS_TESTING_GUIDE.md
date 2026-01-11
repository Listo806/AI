# Push Notifications Testing Guide

This guide will help you test the Web Push Notification integration via Postman and browser.

## Prerequisites

1. **VAPID Keys**
   - Generate VAPID keys for your application
   - These are required for Web Push API

2. **Environment Variables**
   Add these to your `.env` file:
   ```env
   VAPID_PUBLIC_KEY=your_vapid_public_key
   VAPID_PRIVATE_KEY=your_vapid_private_key
   VAPID_SUBJECT=mailto:your-email@example.com
   ```

3. **HTTPS or Localhost**
   - Web Push API requires HTTPS (or localhost for development)
   - For production, you'll need SSL certificates

## Generating VAPID Keys

### Option 1: Using Node.js (Recommended)

Create a temporary script to generate keys:

```javascript
// generate-vapid-keys.js
const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Public Key:');
console.log(vapidKeys.publicKey);
console.log('\nVAPID Private Key:');
console.log(vapidKeys.privateKey);
```

Run it:
```bash
node generate-vapid-keys.js
```

### Option 2: Using Online Tool
- Visit [web-push-codelab.glitch.me](https://web-push-codelab.glitch.me/)
- Click "Generate VAPID Keys"
- Copy the keys

### Option 3: Using Command Line
```bash
npx web-push generate-vapid-keys
```

**Important:** Keep your private key secure! Never expose it to the frontend.

## API Endpoints

All endpoints require JWT authentication. Get your token from the login endpoint first.

Base URL: `http://localhost:3000/api` (or your server URL)

### 1. Get VAPID Public Key

**Endpoint:** `GET /integrations/notifications/vapid-key`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "publicKey": "BEl62iUYgUivxIkv69yViEuiBIa40HI..."
  }
}
```

**Use this** to get the public key for frontend subscription.

---

### 2. Subscribe to Push Notifications

**Endpoint:** `POST /integrations/notifications/subscribe`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/xxx...",
  "keys": {
    "p256dh": "BEl62iUYgUivxIkv69yViEuiBIa40HI...",
    "auth": "8B2v3h5x9..."
  }
}
```

**Note:** The subscription object comes from the browser's Push API. See "Frontend Integration" section below.

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "subscription-uuid"
  }
}
```

**Error Response (Not Configured):**
```json
{
  "message": "Push notification service is not configured",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### 3. Unsubscribe from Push Notifications

**Endpoint:** `POST /integrations/notifications/unsubscribe`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/xxx..."
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Unsubscribed successfully"
}
```

---

### 4. Unsubscribe from All Notifications

**Endpoint:** `DELETE /integrations/notifications/unsubscribe-all`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "count": 2
  }
}
```

---

### 5. Get User's Subscriptions

**Endpoint:** `GET /integrations/notifications/subscriptions`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "id": "uuid-here",
        "endpoint": "https://fcm.googleapis.com/fcm/send/xxx...",
        "created_at": "2025-01-15T10:30:00Z",
        "updated_at": "2025-01-15T10:30:00Z"
      }
    ],
    "count": 1
  }
}
```

---

### 6. Send Test Notification

**Endpoint:** `POST /integrations/notifications/send-test`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "title": "Test Notification",
  "body": "This is a test notification from the real estate platform",
  "icon": "/icon-192x192.png",
  "badge": "/badge-72x72.png",
  "image": "/property-image.jpg",
  "data": {
    "url": "/properties/123",
    "propertyId": "uuid-here"
  },
  "requireInteraction": false,
  "silent": false
}
```

**Fields:**
- `title`: Notification title (required)
- `body`: Notification message (required)
- `icon`: Icon URL (optional)
- `badge`: Badge icon URL (optional)
- `image`: Large image URL (optional)
- `data`: Custom data object (optional)
- `requireInteraction`: Require user interaction to dismiss (optional, default: false)
- `silent`: Silent notification (optional, default: false)

**Success Response:**
```json
{
  "success": true,
  "data": {
    "sent": 1,
    "failed": 0
  }
}
```

---

### 7. Send Notification to User/Team

**Endpoint:** `POST /integrations/notifications/send`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Send to Specific User:**
```json
{
  "userId": "user-uuid-here",
  "title": "New Lead Assigned",
  "body": "You have been assigned a new lead: John Doe",
  "data": {
    "leadId": "lead-uuid",
    "url": "/leads/lead-uuid"
  }
}
```

**Send to Team:**
```json
{
  "teamId": "team-uuid-here",
  "title": "Team Announcement",
  "body": "New property listing added to your team",
  "data": {
    "propertyId": "property-uuid",
    "url": "/properties/property-uuid"
  }
}
```

**Send to All (Admin Only):**
```json
{
  "title": "System Maintenance",
  "body": "Scheduled maintenance tonight at 2 AM",
  "data": {
    "type": "maintenance"
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "sent": 5,
    "failed": 0
  }
}
```

---

### 8. Check Configuration Status

**Endpoint:** `GET /integrations/notifications/config/status`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "isConfigured": true,
  "hasPublicKey": true,
  "hasPrivateKey": true,
  "vapidSubject": "mailto:admin@example.com",
  "publicKeyPrefix": "BEl62iUYgU..."
}
```

---

## Frontend Integration

To test push notifications, you need to subscribe from a browser. Here's a basic example:

### HTML/JavaScript Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Push Notification Test</title>
</head>
<body>
  <button id="subscribe-btn">Subscribe to Notifications</button>
  <button id="unsubscribe-btn">Unsubscribe</button>
  <button id="test-btn">Send Test Notification</button>

  <script>
    const API_BASE = 'http://localhost:3000/api';
    const JWT_TOKEN = 'your-jwt-token-here'; // Get from login

    // Get VAPID public key
    async function getVapidKey() {
      const response = await fetch(`${API_BASE}/integrations/notifications/vapid-key`, {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`
        }
      });
      const data = await response.json();
      return data.data.publicKey;
    }

    // Convert VAPID key to Uint8Array
    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    }

    // Subscribe to push notifications
    async function subscribe() {
      try {
        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Notification permission denied');
          return;
        }

        // Get VAPID public key
        const vapidPublicKey = await getVapidKey();
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

        // Register service worker (if using PWA)
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        });

        // Send subscription to backend
        const response = await fetch(`${API_BASE}/integrations/notifications/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JWT_TOKEN}`
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
              auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
            }
          })
        });

        const data = await response.json();
        console.log('Subscribed:', data);
        alert('Subscribed to push notifications!');
      } catch (error) {
        console.error('Subscription error:', error);
        alert('Failed to subscribe: ' + error.message);
      }
    }

    // Unsubscribe
    async function unsubscribe() {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          await subscription.unsubscribe();
          
          await fetch(`${API_BASE}/integrations/notifications/unsubscribe`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${JWT_TOKEN}`
            },
            body: JSON.stringify({
              endpoint: subscription.endpoint
            })
          });
          
          alert('Unsubscribed successfully!');
        }
      } catch (error) {
        console.error('Unsubscribe error:', error);
      }
    }

    // Send test notification
    async function sendTest() {
      try {
        const response = await fetch(`${API_BASE}/integrations/notifications/send-test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JWT_TOKEN}`
          },
          body: JSON.stringify({
            title: 'Test Notification',
            body: 'This is a test notification!',
            data: {
              url: '/test'
            }
          })
        });
        const data = await response.json();
        console.log('Notification sent:', data);
        alert(`Notification sent! Sent: ${data.data.sent}, Failed: ${data.data.failed}`);
      } catch (error) {
        console.error('Send error:', error);
      }
    }

    // Event listeners
    document.getElementById('subscribe-btn').addEventListener('click', subscribe);
    document.getElementById('unsubscribe-btn').addEventListener('click', unsubscribe);
    document.getElementById('test-btn').addEventListener('click', sendTest);
  </script>
</body>
</html>
```

---

## Postman Testing

### Step 1: Get VAPID Public Key
```
GET {{base_url}}/integrations/notifications/vapid-key
Authorization: Bearer {{jwt_token}}
```

### Step 2: Check Configuration
```
GET {{base_url}}/integrations/notifications/config/status
Authorization: Bearer {{jwt_token}}
```

### Step 3: Get Subscriptions
```
GET {{base_url}}/integrations/notifications/subscriptions
Authorization: Bearer {{jwt_token}}
```

### Step 4: Send Test Notification
```
POST {{base_url}}/integrations/notifications/send-test
Authorization: Bearer {{jwt_token}}
Body (JSON):
{
  "title": "Test from Postman",
  "body": "This notification was sent via Postman",
  "data": {
    "source": "postman"
  }
}
```

**Note:** To fully test subscription, you need to use a browser with the frontend code above.

---

## Common Issues & Solutions

### Issue 1: "Push notification service is not configured"

**Solution:**
1. Check your `.env` file has VAPID keys:
   ```env
   VAPID_PUBLIC_KEY=your_public_key
   VAPID_PRIVATE_KEY=your_private_key
   VAPID_SUBJECT=mailto:your@email.com
   ```
2. Restart your server after adding variables
3. Check server logs for configuration messages

### Issue 2: "Notification permission denied"

**Solution:**
- User must grant notification permission in browser
- Permission can only be requested once per domain
- User can change permission in browser settings

### Issue 3: "Service Worker registration failed"

**Solution:**
- Service worker is required for push notifications
- Must be served over HTTPS (or localhost)
- Service worker file must exist and be accessible

### Issue 4: "Invalid subscription"

**Solution:**
- Subscription endpoint may have expired
- Re-subscribe the user
- Invalid subscriptions are automatically removed

### Issue 5: "Failed to send notification"

**Possible Causes:**
1. **Invalid subscription**: Subscription expired or invalid
   - Solution: User needs to re-subscribe
2. **Network error**: Can't reach push service
   - Solution: Check internet connection
3. **VAPID key mismatch**: Keys don't match
   - Solution: Verify VAPID keys are correct

---

## Testing Workflow

### 1. Initial Setup
```
1. Generate VAPID keys
2. Add to .env file
3. Restart server
4. Check config status endpoint
5. Verify isConfigured: true
```

### 2. Frontend Subscription
```
1. Open test HTML page in browser
2. Click "Subscribe to Notifications"
3. Grant notification permission
4. Verify subscription in database
```

### 3. Send Test Notification
```
1. Use send-test endpoint
2. Verify notification appears in browser
3. Check notification data
4. Test notification click action
```

### 4. Production Testing
```
1. Deploy with HTTPS
2. Test on real devices
3. Monitor notification delivery
4. Check for invalid subscriptions
```

---

## Production Considerations

### 1. HTTPS Required
- Web Push API requires HTTPS (except localhost)
- Get SSL certificate for your domain
- Use Let's Encrypt for free certificates

### 2. Service Worker
- Required for push notifications
- Must be registered on your domain
- Handle push events in service worker

### 3. Notification Best Practices
- Don't spam users with notifications
- Make notifications actionable
- Include relevant data for deep linking
- Respect user preferences

### 4. Error Handling
- Monitor failed notifications
- Remove invalid subscriptions automatically
- Log notification delivery status
- Alert on high failure rates

### 5. Security
- Keep VAPID private key secure
- Never expose private key to frontend
- Validate subscription data
- Rate limit notification sending

---

## Service Worker Example

Create `public/sw.js`:

```javascript
// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    image: data.image,
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    vibrate: [200, 100, 200],
    tag: data.tag || 'default',
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const url = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.openWindow(url)
  );
});
```

---

## Next Steps

1. ✅ Generate VAPID keys
2. ✅ Configure environment variables
3. ⏳ Test subscription from browser
4. ⏳ Test notification sending
5. ⏳ Integrate with frontend application
6. ⏳ Set up service worker
7. ⏳ Deploy with HTTPS

---

## Resources

- [Web Push API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [web-push Library](https://github.com/web-push-libs/web-push)
- [VAPID Specification](https://tools.ietf.org/html/rfc8292)
- [Service Workers Guide](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

## Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify VAPID keys in config status endpoint
3. Test subscription in browser console
4. Check browser notification permissions
5. Verify service worker is registered

