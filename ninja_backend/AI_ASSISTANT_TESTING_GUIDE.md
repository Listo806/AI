# AI Assistant Testing Guide

This guide will help you test the AI Assistant integration via Postman.

## Prerequisites

1. **AI Provider Account**
   - **OpenAI**: Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - **Anthropic**: Get API key from [Anthropic Console](https://console.anthropic.com/)

2. **Environment Variables**
   Add these to your `.env` file:

   **For OpenAI:**
   ```env
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-your-openai-key-here
   AI_MODEL=gpt-4o-mini
   ```

   **For Anthropic:**
   ```env
   AI_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
   AI_MODEL=claude-3-5-sonnet-20241022
   ```

3. **Test Data**
   - At least one lead in the database
   - At least one published property in the database

## Getting API Keys

### OpenAI
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to API Keys section
4. Create a new secret key
5. Copy the key (starts with `sk-`)

### Anthropic
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Go to API Keys section
4. Create a new key
5. Copy the key (starts with `sk-ant-`)

## API Endpoints

All endpoints require JWT authentication. Get your token from the login endpoint first.

Base URL: `http://localhost:3000/api` (or your server URL)

### 1. Check Configuration Status

**Endpoint:** `GET /integrations/ai/config/status`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "isConfigured": true,
  "provider": "openai",
  "model": "gpt-4o-mini",
  "hasApiKey": true,
  "apiKeyPrefix": "sk-..."
}
```

**Use this first** to verify your AI credentials are loaded correctly.

---

### 2. Chat with AI Assistant

**Endpoint:** `POST /integrations/ai/chat`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful real estate assistant."
    },
    {
      "role": "user",
      "content": "What should I look for when buying a house?"
    }
  ]
}
```

**Multi-turn Conversation:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "I'm looking for a 3 bedroom house in New York"
    },
    {
      "role": "assistant",
      "content": "Great! What's your budget range?"
    },
    {
      "role": "user",
      "content": "Around $500,000"
    }
  ]
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "message": "For a $500,000 budget in New York, you'll want to consider...",
    "usage": {
      "prompt_tokens": 25,
      "completion_tokens": 150,
      "total_tokens": 175
    }
  }
}
```

**Error Response (Not Configured):**
```json
{
  "message": "AI Assistant service is not configured",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### 3. Analyze a Lead

**Endpoint:** `POST /integrations/ai/analyze-lead`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "leadId": "uuid-of-lead-here",
  "includeSuggestions": true
}
```

**Fields:**
- `leadId`: UUID of the lead to analyze (required)
- `includeSuggestions`: If true, also returns property suggestions (optional, default: false)

**Success Response:**
```json
{
  "success": true,
  "data": {
    "analysis": "This lead shows strong interest based on...",
    "insights": {
      "priority": "high",
      "suggestedActions": [
        "Follow up within 24 hours",
        "Schedule property viewing",
        "Send property listings"
      ],
      "riskFactors": [
        "Budget may be lower than typical properties"
      ]
    },
    "propertySuggestions": [
      {
        "propertyId": "uuid-here",
        "title": "Beautiful 3BR House",
        "price": 450000,
        "location": "New York, NY",
        "matchScore": 8.5,
        "matchReasons": [
          "Matches budget range",
          "Has required bedrooms",
          "Location preference match"
        ]
      }
    ]
  }
}
```

**Error Response (Lead Not Found):**
```json
{
  "message": "Lead not found",
  "error": "Bad Request",
  "statusCode": 400
}
```

**Note:** The `includeSuggestions` flag will also fetch and rank properties based on the lead's information.

---

### 4. Suggest Properties

**Endpoint:** `POST /integrations/ai/suggest-properties`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "criteria": {
    "budget": {
      "min": 300000,
      "max": 600000
    },
    "location": "New York",
    "bedrooms": 3,
    "bathrooms": 2,
    "propertyType": "sale",
    "preferences": "Near schools, good neighborhood"
  },
  "limit": 10
}
```

**Fields:**
- `criteria.budget.min`: Minimum price (optional)
- `criteria.budget.max`: Maximum price (optional)
- `criteria.location`: Location preference (optional)
- `criteria.bedrooms`: Minimum bedrooms (optional)
- `criteria.bathrooms`: Minimum bathrooms (optional)
- `criteria.propertyType`: "sale" or "rent" (optional)
- `criteria.preferences`: Free-form text preferences (optional)
- `limit`: Maximum number of suggestions (optional, default: 20)

**Success Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "propertyId": "uuid-here",
        "title": "Beautiful 3BR House",
        "price": 450000,
        "location": "New York, NY",
        "matchScore": 9.2,
        "matchReasons": [
          "Perfect budget match",
          "Meets bedroom requirement",
          "Location matches preference",
          "Near schools as requested"
        ]
      },
      {
        "propertyId": "uuid-here-2",
        "title": "Modern 3BR Condo",
        "price": 380000,
        "location": "Brooklyn, NY",
        "matchScore": 8.5,
        "matchReasons": [
          "Within budget",
          "Meets all requirements",
          "Good neighborhood"
        ]
      }
    ],
    "count": 2
  }
}
```

**Note:** Properties are automatically filtered by your team/user and ranked by AI match score.

---

## Postman Collection Setup

### Step 1: Create Environment Variables

In Postman, create a new environment with:
- `base_url`: `http://localhost:3000/api`
- `jwt_token`: (Get this from login endpoint)
- `lead_id`: (UUID of a test lead)
- `property_id`: (UUID of a test property)

### Step 2: Authentication Setup

1. **Get JWT Token:**
   ```
   POST {{base_url}}/auth/login
   Body: {
     "email": "your@email.com",
     "password": "yourpassword"
   }
   ```
   Copy the `accessToken` and set it as `jwt_token` in your environment.

2. **Set Authorization Header:**
   In Postman, go to the Authorization tab:
   - Type: Bearer Token
   - Token: `{{jwt_token}}`

### Step 3: Test Requests

#### Request 1: Check Config
```
GET {{base_url}}/integrations/ai/config/status
```

#### Request 2: Simple Chat
```
POST {{base_url}}/integrations/ai/chat
Body (raw JSON):
{
  "messages": [
    {
      "role": "user",
      "content": "What are the key factors to consider when buying a house?"
    }
  ]
}
```

#### Request 3: Analyze Lead
```
POST {{base_url}}/integrations/ai/analyze-lead
Body (raw JSON):
{
  "leadId": "{{lead_id}}",
  "includeSuggestions": true
}
```

#### Request 4: Suggest Properties
```
POST {{base_url}}/integrations/ai/suggest-properties
Body (raw JSON):
{
  "criteria": {
    "budget": {
      "min": 300000,
      "max": 600000
    },
    "bedrooms": 3,
    "propertyType": "sale",
    "preferences": "Family-friendly neighborhood"
  },
  "limit": 5
}
```

---

## Common Issues & Solutions

### Issue 1: "AI Assistant service is not configured"

**Solution:**
1. Check your `.env` file has the correct provider and API key:
   ```env
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-your-key-here
   ```
2. Restart your server after adding variables
3. Check server logs for configuration messages
4. Verify API key is valid (not expired)

### Issue 2: "Invalid API key" or "Authentication failed"

**Solution:**
- Verify your API key is correct
- For OpenAI: Key should start with `sk-`
- For Anthropic: Key should start with `sk-ant-`
- Check if key has expired or been revoked
- Ensure no extra spaces or quotes in `.env` file

### Issue 3: "Rate limit exceeded"

**Solution:**
- You've hit the API rate limit for your plan
- Wait a few minutes and retry
- Consider upgrading your API plan
- Implement rate limiting in your application

### Issue 4: "Lead not found" when analyzing

**Solution:**
- Verify the lead ID exists in your database
- Ensure the lead belongs to your team/user
- Check you're using the correct UUID format

### Issue 5: "No properties found" in suggestions

**Solution:**
- Ensure you have published properties in the database
- Check property filters (team_id, status='published')
- Verify criteria aren't too restrictive
- Try broader search criteria

### Issue 6: AI response is slow

**Solution:**
- This is normal - AI API calls take 2-10 seconds
- Consider using faster models (e.g., `gpt-4o-mini` instead of `gpt-4`)
- Implement caching for common queries
- Use streaming responses for better UX (future enhancement)

---

## Testing Workflow

### 1. Initial Setup
```
1. Add AI provider credentials to .env
2. Restart server
3. Check config status endpoint
4. Verify isConfigured: true
```

### 2. Test Basic Chat
```
1. Get JWT token (login)
2. Send simple chat message
3. Verify AI response is received
4. Test multi-turn conversation
```

### 3. Test Lead Analysis
```
1. Create a test lead (or use existing)
2. Add notes to the lead
3. Call analyze-lead endpoint
4. Verify analysis and insights
5. Test with includeSuggestions: true
```

### 4. Test Property Suggestions
```
1. Ensure you have published properties
2. Send suggest-properties request
3. Verify properties are returned
4. Check match scores and reasons
5. Test with different criteria
```

### 5. Error Handling
```
1. Test with invalid API key
2. Test with missing lead ID
3. Test with no properties matching criteria
4. Verify error messages are clear
```

---

## Example Use Cases

### Use Case 1: Customer Support Chat
```json
POST /integrations/ai/chat
{
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful real estate customer support agent."
    },
    {
      "role": "user",
      "content": "I'm interested in properties in downtown area"
    }
  ]
}
```

### Use Case 2: Lead Qualification
```json
POST /integrations/ai/analyze-lead
{
  "leadId": "lead-uuid",
  "includeSuggestions": false
}
```

### Use Case 3: Property Matching
```json
POST /integrations/ai/suggest-properties
{
  "criteria": {
    "budget": { "max": 500000 },
    "bedrooms": 2,
    "propertyType": "rent",
    "preferences": "Pet-friendly, parking available"
  }
}
```

---

## Production Considerations

### 1. Cost Management
- Monitor API usage and costs
- Set usage limits per user/team
- Cache common queries
- Use cheaper models for simple tasks

### 2. Rate Limiting
- Implement rate limiting per user
- Queue requests if needed
- Handle rate limit errors gracefully

### 3. Error Handling
- Log all AI API errors
- Implement retry logic with exponential backoff
- Fallback to non-AI features if service is down

### 4. Security
- Never expose API keys to frontend
- Validate and sanitize user inputs
- Monitor for prompt injection attacks
- Set appropriate token limits

### 5. Performance
- Use streaming for long responses (future)
- Cache frequently asked questions
- Optimize prompts for faster responses
- Consider async processing for heavy analysis

---

## Model Recommendations

### OpenAI Models
- **gpt-4o-mini**: Fast, cheap, good for most tasks (recommended)
- **gpt-4o**: Better quality, more expensive
- **gpt-3.5-turbo**: Legacy, still works but gpt-4o-mini is better

### Anthropic Models
- **claude-3-5-sonnet-20241022**: Best balance (recommended)
- **claude-3-opus-20240229**: Highest quality, most expensive
- **claude-3-haiku-20240307**: Fastest, cheapest

---

## Next Steps

1. ✅ Test basic chat functionality
2. ⏳ Test lead analysis with real leads
3. ⏳ Test property suggestions
4. ⏳ Implement caching for common queries
5. ⏳ Add streaming support for better UX
6. ⏳ Integrate with frontend chat interface

---

## Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [OpenAI Pricing](https://openai.com/pricing)
- [Anthropic Pricing](https://www.anthropic.com/pricing)

---

## Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify credentials in config status endpoint
3. Test API key directly with provider's API
4. Check provider status pages for outages

