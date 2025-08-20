# Deployment Guide for Render.com

## Prerequisites
- A GitHub account with your code repository
- A Render.com account
- PostgreSQL database (will be created on Render)

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin master
```

### 2. Create PostgreSQL Database on Render
1. Go to Render Dashboard
2. Click "New +" → "PostgreSQL"
3. Fill in:
   - Name: `homevend-db`
   - Database: `homevend`
   - User: `homevend_user`
   - Region: Choose closest to your users
   - Instance Type: Free tier
4. Click "Create Database"
5. Wait for database to be created
6. Copy the Internal Database URL for later use

### 3. Deploy Web Service
1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Name: `homevend-backend`
   - Environment: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Instance Type: Free tier

### 4. Add Environment Variables
In the web service settings, add these environment variables:

```
NODE_ENV=production
DATABASE_URL=[Paste Internal Database URL from Step 2]
JWT_SECRET=[Generate a secure random string]
JWT_REFRESH_SECRET=[Generate another secure random string]
CLIENT_URL=https://your-frontend-url.com
PORT=5000
```

### 5. Run Database Migrations
After first deployment:
1. Go to web service Shell tab
2. Run: `npm run migration:run`

## Alternative: Using render.yaml (Automatic)
1. The `render.yaml` file is already configured
2. In Render Dashboard, click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically create services based on render.yaml
5. Add the JWT secrets manually in environment variables

## Important Notes
- Database credentials are removed from source code for security
- Use environment variables for all sensitive data
- The free tier database will sleep after 90 days of inactivity
- SSL is automatically configured for PostgreSQL connections in production

## Monitoring
- Check service logs in Render Dashboard
- Monitor database connections and performance
- Set up health check endpoint at `/health`

## Troubleshooting
- If migrations fail, check database connection
- If build fails, check TypeScript compilation errors
- Ensure all environment variables are set correctly