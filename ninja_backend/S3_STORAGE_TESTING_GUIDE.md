# AWS S3 Storage Integration - Postman Testing Guide

## Prerequisites

1. **Get JWT Token** - All storage endpoints require authentication
2. **Configure AWS S3 Credentials** - Add to your `.env` file:
   ```env
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your_bucket_name
   ```
3. **S3 Bucket Setup** - Ensure your S3 bucket exists and is accessible
4. **Server Running** - Backend running on `http://localhost:3000`
5. **Run Migration** - Ensure `005_milestone4_storage.sql` has been run

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

**Copy the `accessToken`** - you'll need it for all storage requests.

---

## Step 2: Upload a File

### Endpoint
```
POST http://localhost:3000/api/integrations/storage/upload
```

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Request Body (multipart/form-data)
- **Key**: `file` (type: File)
- **Key**: `folder` (type: Text, optional) - e.g., "properties", "documents"
- **Key**: `teamId` (type: Text, optional) - UUID of team

### Postman Setup

1. **Method**: POST
2. **URL**: `http://localhost:3000/api/integrations/storage/upload`
3. **Headers**: 
   - `Authorization: Bearer YOUR_ACCESS_TOKEN`
   - (Don't set Content-Type - Postman will set it automatically for multipart)
4. **Body Tab**: 
   - Select `form-data`
   - Add key `file` with type `File` → Click "Select Files" and choose a file
   - Add key `folder` (optional) with type `Text` → Value: `properties`
   - Add key `teamId` (optional) with type `Text` → Value: your team UUID

### Sample Test Cases

**Test Case 1: Upload Image (Property Photo)**
- `file`: Select a `.jpg` or `.png` image file
- `folder`: `properties`
- `teamId`: (leave empty or use your team ID)

**Test Case 2: Upload Document**
- `file`: Select a `.pdf` or `.doc` file
- `folder`: `documents`
- `teamId`: (optional)

**Test Case 3: Upload Video**
- `file`: Select a `.mp4` or `.mov` file
- `folder`: `videos`
- `teamId`: (optional)

### Expected Response (Success)
```json
{
  "id": "f0b07f32-e586-4ed5-a0ef-a3bdd35c7dc3",
  "originalName": "property-photo.jpg",
  "fileName": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
  "url": "https://your-bucket.s3.us-east-1.amazonaws.com/properties/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
  "key": "properties/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
  "mimeType": "image/jpeg",
  "size": 245678,
  "folder": "properties",
  "userId": "user-uuid",
  "teamId": "team-uuid",
  "createdAt": "2025-12-28T14:30:00.000Z"
}
```

### Expected Response (Error - No File)
```json
{
  "statusCode": 400,
  "message": "No file provided",
  "error": "Bad Request"
}
```

### Expected Response (Error - Not Configured)
```json
{
  "statusCode": 400,
  "message": "Storage service is not configured",
  "error": "Bad Request"
}
```

---

## Step 3: List Files

### Endpoint
```
GET http://localhost:3000/api/integrations/storage/files
```

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Query Parameters (all optional)
- `teamId` - Filter by team ID
- `folder` - Filter by folder name

### Postman Setup

**Request 1: List All Files**
```
GET http://localhost:3000/api/integrations/storage/files
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request 2: List Files in Folder**
```
GET http://localhost:3000/api/integrations/storage/files?folder=properties
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request 3: List Files by Team**
```
GET http://localhost:3000/api/integrations/storage/files?teamId=team-uuid
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request 4: List Files by Team and Folder**
```
GET http://localhost:3000/api/integrations/storage/files?teamId=team-uuid&folder=properties
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Expected Response (Success)
```json
[
  {
    "id": "f0b07f32-e586-4ed5-a0ef-a3bdd35c7dc3",
    "originalName": "property-photo.jpg",
    "fileName": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
    "url": "https://your-bucket.s3.us-east-1.amazonaws.com/properties/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
    "key": "properties/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
    "mimeType": "image/jpeg",
    "size": 245678,
    "folder": "properties",
    "userId": "user-uuid",
    "teamId": "team-uuid",
    "createdAt": "2025-12-28T14:30:00.000Z"
  },
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "originalName": "document.pdf",
    "fileName": "b2c3d4e5-f6a7-8901-bcde-f12345678901.pdf",
    "url": "https://your-bucket.s3.us-east-1.amazonaws.com/documents/b2c3d4e5-f6a7-8901-bcde-f12345678901.pdf",
    "key": "documents/b2c3d4e5-f6a7-8901-bcde-f12345678901.pdf",
    "mimeType": "application/pdf",
    "size": 1024567,
    "folder": "documents",
    "userId": "user-uuid",
    "teamId": "team-uuid",
    "createdAt": "2025-12-28T14:25:00.000Z"
  }
]
```

---

## Step 4: Get File Metadata

### Endpoint
```
GET http://localhost:3000/api/integrations/storage/files/:id
```

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Postman Setup

**Request:**
```
GET http://localhost:3000/api/integrations/storage/files/f0b07f32-e586-4ed5-a0ef-a3bdd35c7dc3
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Replace `f0b07f32-e586-4ed5-a0ef-a3bdd35c7dc3` with the actual file ID from upload response.

### Expected Response (Success)
```json
{
  "id": "f0b07f32-e586-4ed5-a0ef-a3bdd35c7dc3",
  "originalName": "property-photo.jpg",
  "fileName": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
  "url": "https://your-bucket.s3.us-east-1.amazonaws.com/properties/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
  "key": "properties/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg",
  "mimeType": "image/jpeg",
  "size": 245678,
  "folder": "properties",
  "userId": "user-uuid",
  "teamId": "team-uuid",
  "createdAt": "2025-12-28T14:30:00.000Z"
}
```

### Expected Response (Not Found)
```json
{
  "statusCode": 404,
  "message": "File not found",
  "error": "Not Found"
}
```

---

## Step 5: Get Signed URL (Temporary Access)

### Endpoint
```
GET http://localhost:3000/api/integrations/storage/files/:id/url
```

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Query Parameters (optional)
- `expiresIn` - URL expiration time in seconds (default: 3600 = 1 hour)

### Postman Setup

**Request 1: Default Expiration (1 hour)**
```
GET http://localhost:3000/api/integrations/storage/files/f0b07f32-e586-4ed5-a0ef-a3bdd35c7dc3/url
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Request 2: Custom Expiration (30 minutes)**
```
GET http://localhost:3000/api/integrations/storage/files/f0b07f32-e586-4ed5-a0ef-a3bdd35c7dc3/url?expiresIn=1800
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Expected Response (Success)
```json
{
  "url": "https://your-bucket.s3.us-east-1.amazonaws.com/properties/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg?X-Amz-Algorithm=...&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=...",
  "expiresIn": 3600
}
```

**Note**: The signed URL can be used to access the file directly, even if the bucket is private.

---

## Step 6: Delete a File

### Endpoint
```
DELETE http://localhost:3000/api/integrations/storage/files/:id
```

### Headers
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Postman Setup

**Request:**
```
DELETE http://localhost:3000/api/integrations/storage/files/f0b07f32-e586-4ed5-a0ef-a3bdd35c7dc3
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Expected Response (Success)
```json
{
  "message": "File deleted successfully"
}
```

### Expected Response (Not Found)
```json
{
  "statusCode": 404,
  "message": "File not found",
  "error": "Not Found"
}
```

### Expected Response (Permission Denied)
```json
{
  "statusCode": 400,
  "message": "You do not have permission to delete this file",
  "error": "Bad Request"
}
```

**Note**: Users can only delete files they uploaded.

---

## Postman Collection Setup

### 1. Create Environment Variables

In Postman, create an environment with:
- `base_url`: `http://localhost:3000/api`
- `access_token`: (set after login)
- `file_id`: (set after upload - for testing get/delete)

### 2. Create Collection: "AWS S3 Storage"

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

#### Request 2: Upload File
- **Method**: POST
- **URL**: `{{base_url}}/integrations/storage/upload`
- **Headers**:
  - `Authorization`: `Bearer {{access_token}}`
- **Body** (form-data):
  - `file`: [Select File]
  - `folder`: `properties` (optional)
  - `teamId`: (optional)
- **Tests Tab** (to save file ID):
```javascript
if (pm.response.code === 200 || pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("file_id", response.id);
    pm.environment.set("file_url", response.url);
}
```

#### Request 3: List Files
- **Method**: GET
- **URL**: `{{base_url}}/integrations/storage/files`
- **Headers**:
  - `Authorization`: `Bearer {{access_token}}`
- **Params** (optional):
  - `folder`: `properties`
  - `teamId`: (your team ID)

#### Request 4: Get File Metadata
- **Method**: GET
- **URL**: `{{base_url}}/integrations/storage/files/{{file_id}}`
- **Headers**:
  - `Authorization`: `Bearer {{access_token}}`

#### Request 5: Get Signed URL
- **Method**: GET
- **URL**: `{{base_url}}/integrations/storage/files/{{file_id}}/url`
- **Headers**:
  - `Authorization`: `Bearer {{access_token}}`
- **Params** (optional):
  - `expiresIn`: `1800` (30 minutes)

#### Request 6: Delete File
- **Method**: DELETE
- **URL**: `{{base_url}}/integrations/storage/files/{{file_id}}`
- **Headers**:
  - `Authorization`: `Bearer {{access_token}}`

---

## Testing Workflow

### Complete Test Flow

1. **Login** → Get access token
2. **Upload File** → Get file ID and URL
3. **List Files** → Verify file appears in list
4. **Get File Metadata** → Verify file details
5. **Get Signed URL** → Get temporary access URL
6. **Verify File in S3** → Check S3 bucket directly (optional)
7. **Delete File** → Remove file from S3 and database

### Sample Test Files

Create test files in a folder for easy testing:
- `test-image.jpg` (small image, ~100KB)
- `test-document.pdf` (small PDF, ~50KB)
- `test-video.mp4` (small video, ~1MB)

---

## Common Issues & Solutions

### Issue 1: "Storage service is not configured"
**Solution**: 
- Check `.env` file has all AWS credentials:
  ```env
  AWS_ACCESS_KEY_ID=your_key
  AWS_SECRET_ACCESS_KEY=your_secret
  AWS_REGION=us-east-1
  AWS_S3_BUCKET=your_bucket_name
  ```
- Restart dev server after adding credentials
- Verify credentials are correct in AWS Console

### Issue 2: "Access Denied" or "InvalidAccessKeyId"
**Solution**:
- Verify AWS credentials are correct
- Check IAM user has S3 permissions:
  - `s3:PutObject`
  - `s3:GetObject`
  - `s3:DeleteObject`
  - `s3:ListBucket`
- Verify bucket name is correct
- Check bucket region matches `AWS_REGION`

### Issue 3: "No such bucket"
**Solution**:
- Verify bucket name in `.env` matches actual bucket name
- Check bucket exists in AWS Console
- Ensure bucket is in the correct region

### Issue 4: "File not found" after upload
**Solution**:
- Check database migration was run (`005_milestone4_storage.sql`)
- Verify `stored_files` table exists
- Check server logs for database errors

### Issue 5: "You do not have permission to delete this file"
**Solution**:
- Users can only delete their own files
- Verify you're using the token from the user who uploaded the file
- Check `user_id` in file metadata matches your user ID

### Issue 6: Upload fails with large files
**Solution**:
- Check S3 bucket size limits
- Verify network connection
- Check server logs for timeout errors
- Consider increasing timeout in storage service

---

## AWS S3 Bucket Configuration

### Required IAM Permissions

Your AWS IAM user/role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

### Bucket Settings

1. **CORS Configuration** (if accessing from browser):
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["http://localhost:5173", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

2. **Bucket Policy** (if needed for public access):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

**Note**: For production, use signed URLs instead of public bucket access.

---

## Quick Test Checklist

- [ ] Server is running on port 3000
- [ ] AWS credentials configured in `.env`
- [ ] S3 bucket exists and is accessible
- [ ] Migration `005_milestone4_storage.sql` has been run
- [ ] User account exists and can login
- [ ] JWT token obtained from login
- [ ] Upload endpoint accepts files
- [ ] Files appear in S3 bucket
- [ ] List files endpoint returns uploaded files
- [ ] Get file metadata works
- [ ] Signed URL generation works
- [ ] Delete file removes from S3 and database

---

## Testing Different File Types

### Images
- `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- Test with various sizes (small, medium, large)
- Verify `mimeType` is set correctly

### Documents
- `.pdf`, `.doc`, `.docx`, `.txt`
- Test with different file sizes
- Verify file can be downloaded via signed URL

### Videos
- `.mp4`, `.mov`, `.avi`
- Test with small videos first
- Check file size limits

### Other
- `.zip`, `.csv`, `.json`
- Test various file types your app will use

---

## Expected Response Times

- **Upload**: 500ms - 5s (depends on file size and network)
- **List Files**: 100-300ms
- **Get Metadata**: 50-150ms
- **Get Signed URL**: 100-200ms
- **Delete**: 200-500ms

If responses are slower, check:
- Network connection to AWS
- S3 bucket region (closer = faster)
- File size
- Server logs for errors

---

## Verification Steps

### 1. Verify File in S3
After upload, check AWS S3 Console:
- Navigate to your bucket
- Look for the file in the folder (if specified)
- Verify file name matches the UUID format
- Check file size matches uploaded file

### 2. Verify File in Database
```sql
SELECT * FROM stored_files 
WHERE user_id = 'your-user-id' 
ORDER BY created_at DESC 
LIMIT 5;
```

### 3. Test Signed URL
- Copy the signed URL from response
- Paste in browser (should download/view file)
- Wait for expiration time and verify URL stops working

---

## Sample cURL Commands

### Upload File
```bash
curl -X POST http://localhost:3000/api/integrations/storage/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/your/file.jpg" \
  -F "folder=properties"
```

### List Files
```bash
curl -X GET "http://localhost:3000/api/integrations/storage/files?folder=properties" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get File
```bash
curl -X GET http://localhost:3000/api/integrations/storage/files/FILE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Signed URL
```bash
curl -X GET "http://localhost:3000/api/integrations/storage/files/FILE_ID/url?expiresIn=3600" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Delete File
```bash
curl -X DELETE http://localhost:3000/api/integrations/storage/files/FILE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

