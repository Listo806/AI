# Deploying to Render from Subdirectory - Step-by-Step Guide

## 🎯 Problem

Your NestJS project is in a subdirectory (`ninja_backend/`) of your git repository, not at the root. Render needs to know where to find your project.

## ✅ Solution

Set the **Root Directory** in Render's service configuration.

---

## 📋 Step-by-Step Instructions

### Step 1: Create Web Service on Render

1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub/GitLab repository

### Step 2: Configure Service Settings

Fill in the following:

**Basic Settings:**
- **Name**: `ninja-backend` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `main` or `master` (your default branch)

**⚠️ CRITICAL: Root Directory**
- **Root Directory**: `ninja_backend`
  - This tells Render where your `package.json` is located
  - Render will run all commands from this directory
  - **This is the key setting for subdirectory projects!**

**Build & Deploy:**
- **Environment**: `Node`
- **Build Command**: `npm install --include=dev && npm run build` ✅ **Recommended**
- **Start Command**: `npm run start:prod`

**⚠️ Important:** The build command must install `devDependencies` (including `@nestjs/cli`). Use `npm install --include=dev` to explicitly ensure all devDependencies are installed.

**Plan:**
- Choose **Free** for testing (services sleep after 15 min inactivity)
- Choose **Starter** ($7/month) or higher for production (always-on)

### Step 3: Add Environment Variables

Before deploying, add your environment variables:

1. Click **"Environment"** tab (or scroll down)
2. Add all required variables (see `PRODUCTION_ENV_VARIABLES.md`)
3. **Important variables:**
   ```env
   DATABASE_URL=postgresql://...
   JWT_SECRET=...
   JWT_REFRESH_SECRET=...
   NODE_ENV=production
   PORT=10000
   API_PREFIX=api
   FRONTEND_URL=https://your-frontend.netlify.app
   ```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Navigate to `ninja_backend/` directory (because of Root Directory setting)
   - Run `npm install`
   - Run `npm run build`
   - Start with `npm run start:prod`

### Step 5: Monitor Build

Watch the build logs. You should see:
```
==> Cloning from https://github.com/your-username/your-repo.git
==> Checking out commit abc123...
==> Changing directory to ninja_backend
==> Running npm install
==> Running npm run build
==> Starting service with npm run start:prod
```

If you see errors about `package.json` not found, the Root Directory is incorrect.

### Step 6: Run Database Migrations

After successful deployment:

1. Go to your service → **Shell** tab
2. The shell will already be in `ninja_backend/` directory
3. Run: `npm run setup:db`
4. Wait for migrations to complete

### Step 7: Verify Deployment

1. Check your service URL (e.g., `https://ninja-backend.onrender.com`)
2. Test the API:
   ```bash
   curl https://ninja-backend.onrender.com/api
   ```
3. Test authentication:
   ```bash
   curl -X POST https://ninja-backend.onrender.com/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123","role":"owner"}'
   ```

---

## 🔧 Alternative: Using render.yaml

You can also configure everything via `render.yaml` file in your repository root.

### Create `render.yaml` in Repository Root

```yaml
services:
  - type: web
    name: ninja-backend
    env: node
    rootDir: ninja_backend  # ⚠️ This is the key setting
    buildCommand: npm install --include=dev && npm run build  # ✅ Recommended
    startCommand: npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: API_PREFIX
        value: api
      # Add other environment variables here
      # Or set them in Render Dashboard
```

**Note:** You still need to add sensitive variables (secrets, API keys) in Render Dashboard, not in `render.yaml`.

### Using render.yaml

1. Create `render.yaml` in your repository root
2. Commit and push to your repository
3. In Render, when creating service, select **"Apply render.yaml"**
4. Render will read the configuration from the file

---

## 🐛 Troubleshooting

### Issue 1: "package.json not found"

**Error:**
```
npm ERR! path /opt/render/project/src/package.json
npm ERR! code ENOENT
```

**Solution:**
- Check **Root Directory** is set to `ninja_backend`
- Verify the directory name matches exactly (case-sensitive)
- Re-deploy after fixing

### Issue 2: Build Fails

**Check:**
- Root Directory is correct
- Build command is correct: `npm install && npm run build`
- All dependencies are in `package.json`
- Node.js version is compatible
- **See `RENDER_BUILD_TROUBLESHOOTING.md` for detailed troubleshooting**

**Common Fixes:**
1. **Node.js Version:** Add `.nvmrc` file or `engines` in `package.json`
2. **Build Command:** Try `npm ci && npm run build` instead
3. **Check Build Logs:** Look for specific error messages

### Issue 3: Service Won't Start

**Check:**
- Start command is correct: `npm run start:prod`
- `dist/` folder exists after build
- `main.js` exists in `dist/` folder
- PORT environment variable is set
- Database connection is working

### Issue 4: Environment Variables Not Loading

**Check:**
- Variables are set in Render Dashboard (not just in `.env` file)
- Variable names are correct (case-sensitive)
- No extra spaces or quotes
- Service was restarted after adding variables

---

## 📝 Complete Render Configuration Example

### Via Dashboard

**Service Settings:**
```
Name: ninja-backend
Environment: Node
Root Directory: ninja_backend
Build Command: npm install && npm run build
Start Command: npm run start:prod
```

**Environment Variables:**
```
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
NODE_ENV=production
PORT=10000
API_PREFIX=api
FRONTEND_URL=https://your-app.netlify.app
# ... add all other variables
```

### Via render.yaml

Create `render.yaml` in repository root:

```yaml
services:
  - type: web
    name: ninja-backend
    env: node
    rootDir: ninja_backend
    buildCommand: npm install --include=dev && npm run build  # ✅ Recommended
    startCommand: npm run start:prod
    plan: starter  # or free
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: API_PREFIX
        value: api
    # Note: Add sensitive variables in Dashboard, not here

databases:
  - name: ninja-backend-db
    plan: free  # or paid plan
    databaseName: ninja_db
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Service builds successfully
- [ ] Service starts without errors
- [ ] API responds at service URL
- [ ] Database migrations ran successfully
- [ ] Authentication endpoints work
- [ ] Environment variables are loaded
- [ ] Logs show no errors

---

## 🎯 Quick Reference

**Key Setting for Subdirectory:**
```
Root Directory: ninja_backend
```

**Build Command:**
```
npm install --include=dev && npm run build
```

**Start Command:**
```
npm run start:prod
```

**After Deployment:**
```
Shell → npm run setup:db
```

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render Subdirectory Projects](https://render.com/docs/deploy-subdirectory)
- See `DEPLOYMENT_GUIDE.md` for complete deployment guide
- See `PRODUCTION_ENV_VARIABLES.md` for environment variables

---

**That's it!** Set the Root Directory to `ninja_backend` and Render will handle the rest.

