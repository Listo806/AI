# WhatsApp Business API Testing Guide

This guide will help you test the WhatsApp Business API integration via Postman.

## Prerequisites

1. **WhatsApp Business API Account**
   - You need a Meta Business Account
   - WhatsApp Business API access (via Meta or a Business Solution Provider)
   - Phone Number ID
   - Access Token (temporary or permanent)

2. **Environment Variables**
   Add these to your `.env` file:
   ```env
   WHATSAPP_PHONE_ID=your_phone_id_here
   WHATSAPP_ACCESS_TOKEN=your_access_token_here
   WHATSAPP_API_VERSION=v18.0
   ```

3. **Test Phone Number**
   - For testing, you need a phone number that's registered with your WhatsApp Business account
   - The recipient must have opted in to receive messages (for production)
   - For development, use Meta's test numbers or your own registered number

## Getting WhatsApp Credentials

### Option 1: Meta Business Manager (Production)
1. Go to [Meta Business Manager](https://business.facebook.com/)
2. Create/Select a Business Account
3. Go to Business Settings > Accounts > WhatsApp Accounts
4. Create a WhatsApp Business Account
5. Get your Phone Number ID and generate an Access Token

### Option 2: Meta for Developers (Testing)
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new App
3. Add "WhatsApp" product
4. Use the Graph API Explorer to get a temporary access token
5. Get your Phone Number ID from the WhatsApp product settings

### Option 3: Business Solution Provider
- Use providers like Twilio, MessageBird, or 360dialog
- They provide simplified APIs and handle Meta integration

## API Endpoints

All endpoints require JWT authentication. Get your token from the login endpoint first.

Base URL: `http://localhost:3000/api` (or your server URL)

### 1. Check Configuration Status

**Endpoint:** `GET /integrations/whatsapp/config/status`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "isConfigured": true,
  "hasPhoneId": true,
  "hasAccessToken": true,
  "apiVersion": "v18.0",
  "phoneIdPrefix": "1234..."
}
```

**Use this first** to verify your WhatsApp credentials are loaded correctly.

---

### 2. Send a Text Message

**Endpoint:** `POST /integrations/whatsapp/send`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "to": "+1234567890",
  "message": "Hello! This is a test message from the real estate platform."
}
```

**Important:**
- Phone number must be in **E.164 format**: `+[country code][number]`
- Example: `+1234567890` (US), `+447911123456` (UK)
- No spaces, dashes, or parentheses

**Success Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "wamid.xxx...",
    "status": "sent"
  }
}
```

**Error Response (Invalid Phone Number):**
```json
{
  "message": "Invalid phone number format. Use E.164 format (e.g., +1234567890)",
  "error": "Bad Request",
  "statusCode": 400
}
```

**Error Response (Not Configured):**
```json
{
  "message": "WhatsApp service is not configured",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### 3. Send a Template Message

**Endpoint:** `POST /integrations/whatsapp/send-template`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "to": "+1234567890",
  "templateName": "hello_world",
  "languageCode": "en",
  "parameters": ["John", "Property Inquiry"]
}
```

**Fields:**
- `to`: Phone number in E.164 format
- `templateName`: Name of your approved WhatsApp template
- `languageCode`: Language code (default: "en")
- `parameters`: Array of strings to fill template variables (optional)

**Note:** Templates must be approved by Meta before use. You can't send arbitrary template names.

**Success Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "wamid.xxx...",
    "status": "sent"
  }
}
```

**Example Template:**
If your template is:
```
Hello {{1}}, thank you for your interest in {{2}}.
```

Then `parameters: ["John", "Property Inquiry"]` will produce:
```
Hello John, thank you for your interest in Property Inquiry.
```

---

### 4. Get Message Status

**Endpoint:** `GET /integrations/whatsapp/status/:messageId`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Example:**
```
GET /integrations/whatsapp/status/wamid.xxx...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "wamid.xxx...",
    "status": "sent"
  }
}
```

**Note:** This is a placeholder endpoint. Real-time status updates come via webhooks. To track actual delivery/read status, you need to implement webhook handlers.

---

## Postman Collection Setup

### Step 1: Create Environment Variables

In Postman, create a new environment with:
- `base_url`: `http://localhost:3000/api`
- `jwt_token`: (Get this from login endpoint)

### Step 2: Authentication Setup

1. **Get JWT Token:**
   ```
   POST {{base_url}}/auth/login
   Body: {
     "email": "your@email.com",
     "password": "yourpassword"
   }
   ```
   Copy the `accessToken` from response and set it as `jwt_token` in your environment.

2. **Set Authorization Header:**
   In Postman, go to the Authorization tab:
   - Type: Bearer Token
   - Token: `{{jwt_token}}`

### Step 3: Test Requests

#### Request 1: Check Config
```
GET {{base_url}}/integrations/whatsapp/config/status
```

#### Request 2: Send Message
```
POST {{base_url}}/integrations/whatsapp/send
Body (raw JSON):
{
  "to": "+1234567890",
  "message": "Test message from Postman"
}
```

#### Request 3: Send Template
```
POST {{base_url}}/integrations/whatsapp/send-template
Body (raw JSON):
{
  "to": "+1234567890",
  "templateName": "hello_world",
  "languageCode": "en",
  "parameters": ["John"]
}
```

---

## Common Issues & Solutions

### Issue 1: "WhatsApp service is not configured"

**Solution:**
1. Check your `.env` file has:
   ```env
   WHATSAPP_PHONE_ID=your_phone_id
   WHATSAPP_ACCESS_TOKEN=your_token
   ```
2. Restart your server after adding variables
3. Check server logs for configuration messages

### Issue 2: "Invalid phone number format"

**Solution:**
- Use E.164 format: `+[country code][number]`
- Examples:
  - ✅ `+1234567890` (US)
  - ✅ `+447911123456` (UK)
  - ❌ `1234567890` (missing +)
  - ❌ `+1 (234) 567-890` (has spaces/formatting)

### Issue 3: "Failed to send WhatsApp message"

**Possible Causes:**
1. **Invalid Access Token**: Token expired or incorrect
   - Solution: Generate a new access token
2. **Phone Number Not Registered**: Recipient not in your WhatsApp Business account
   - Solution: Use a test number registered with your account
3. **Template Not Approved**: Template name doesn't exist or isn't approved
   - Solution: Use only approved template names
4. **Rate Limiting**: Too many requests
   - Solution: Wait and retry

### Issue 4: "Template not found"

**Solution:**
- Templates must be created and approved in Meta Business Manager
- Use exact template name (case-sensitive)
- Check template exists in your WhatsApp Business account

### Issue 5: Message sent but not received

**Possible Causes:**
1. **24-hour window expired**: Can only send free-form messages within 24 hours of user's last message
   - Solution: Use template messages for outbound communication
2. **User blocked your number**
3. **Network issues**

---

## Testing Workflow

### 1. Initial Setup
```
1. Add WhatsApp credentials to .env
2. Restart server
3. Check config status endpoint
4. Verify isConfigured: true
```

### 2. Test Basic Message
```
1. Get JWT token (login)
2. Send test message to your own number
3. Verify message received on WhatsApp
4. Check response for messageId
```

### 3. Test Template (if available)
```
1. List your approved templates in Meta Business Manager
2. Send template message with parameters
3. Verify template renders correctly
```

### 4. Error Handling
```
1. Test with invalid phone number format
2. Test with missing credentials
3. Test with invalid template name
4. Verify error messages are clear
```

---

## Production Considerations

### 1. Webhook Setup
For production, implement webhook handlers to:
- Track message delivery status
- Handle incoming messages
- Update message status in database

### 2. Template Management
- Create and approve templates in Meta Business Manager
- Store template names in database
- Validate template usage before sending

### 3. Rate Limiting
- WhatsApp has rate limits (varies by tier)
- Implement rate limiting in your service
- Queue messages if needed

### 4. Error Handling
- Log all API errors
- Retry failed messages with exponential backoff
- Notify admins of persistent failures

### 5. Security
- Store access tokens securely
- Rotate tokens regularly
- Use permanent tokens for production (not temporary)
- Implement webhook signature verification

---

## Next Steps

1. ✅ Test basic message sending
2. ⏳ Set up webhook handlers for status updates
3. ⏳ Create and approve message templates
4. ⏳ Integrate with Leads module for automated messaging
5. ⏳ Implement message queuing for high volume

---

## Resources

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Meta for Developers](https://developers.facebook.com/)
- [WhatsApp Business API Pricing](https://developers.facebook.com/docs/whatsapp/pricing)
- [E.164 Phone Number Format](https://en.wikipedia.org/wiki/E.164)

---

## Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify credentials in config status endpoint
3. Test with Meta's Graph API Explorer
4. Check WhatsApp Business API status page

