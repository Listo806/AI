# AWS S3 Setup Guide

## Quick Fix for "Storage service is not configured"

This error means one or more AWS environment variables are missing or not being read.

## Step 1: Check Your .env File

Make sure your `.env` file in the `ninja_backend` folder contains:

```env
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

**Important:**
- No spaces around the `=` sign
- No quotes around the values (unless the value itself contains spaces)
- Make sure there are no typos in variable names

## Step 2: Verify .env File Location

The `.env` file must be in the `ninja_backend` folder (same level as `package.json`):

```
ninja_backend/
├── .env          ← Must be here
├── package.json
├── src/
└── ...
```

## Step 3: Check Server Logs

When you start the server, look for these log messages:

**If configured correctly:**
```
[AWS S3 Storage] AWS S3 storage configured - Bucket: your-bucket-name, Region: us-east-1
```

**If missing variables:**
```
[AWS S3 Storage] AWS_ACCESS_KEY_ID is missing
[AWS S3 Storage] AWS_SECRET_ACCESS_KEY is missing
[AWS S3 Storage] AWS_S3_BUCKET is missing
[AWS S3 Storage] AWS S3 not configured. Storage features will be disabled.
```

## Step 4: Restart Server

After adding/updating `.env` variables:
1. Stop the dev server (Ctrl+C)
2. Start it again: `npm run start:dev`
3. Check the logs for configuration messages

## Step 5: Verify Environment Variables Are Loaded

You can temporarily add a test endpoint to verify (or check server logs):

The server logs will show which variables are missing when it starts.

## Common Issues

### Issue 1: .env File Not in Correct Location
**Solution**: Make sure `.env` is in `ninja_backend/` folder, not in parent directory

### Issue 2: Variable Names Have Typos
**Solution**: Check exact spelling:
- `AWS_ACCESS_KEY_ID` (not `AWS_ACCESS_KEY`)
- `AWS_SECRET_ACCESS_KEY` (not `AWS_SECRET_KEY`)
- `AWS_S3_BUCKET` (not `AWS_BUCKET` or `S3_BUCKET`)

### Issue 3: Values Have Extra Spaces
**Solution**: 
```env
# ❌ Wrong
AWS_ACCESS_KEY_ID = your_key
AWS_S3_BUCKET="your-bucket"

# ✅ Correct
AWS_ACCESS_KEY_ID=your_key
AWS_S3_BUCKET=your-bucket
```

### Issue 4: Server Not Restarted
**Solution**: Environment variables are loaded at startup. You MUST restart the server after changing `.env`

### Issue 5: .env File Not Loaded
**Solution**: 
- Verify `dotenv.config()` is called in `main.ts` (it is)
- Check if `.env` file exists in the correct location
- Make sure file is not named `.env.txt` or similar

## Quick Verification

1. **Check .env exists:**
   ```bash
   # In ninja_backend folder
   ls .env
   # OR on Windows
   dir .env
   ```

2. **Check variables are set:**
   ```bash
   # In ninja_backend folder
   cat .env | grep AWS
   # OR on Windows PowerShell
   Get-Content .env | Select-String "AWS"
   ```

3. **Check server logs on startup:**
   Look for the log message that shows which variables are missing

## Example .env Configuration

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ninja_db

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# AWS S3 (Required for storage)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=my-app-storage-bucket

# Mapbox (Optional)
MAPBOX_ACCESS_TOKEN=your_mapbox_token

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Testing Configuration

After setting up, check server logs. You should see:
```
[AWS S3 Storage] AWS S3 storage configured - Bucket: your-bucket-name, Region: us-east-1
```

If you see warnings about missing variables, fix them and restart the server.

