# Workify Deployment Guide

This guide covers deploying Workify to various platforms with proper security and performance configurations.

## Prerequisites

- Node.js 18+ installed
- Supabase project set up
- OpenAI API key
- Domain name (for production)

## Environment Variables

Copy `env.example` to `.env.local` and fill in the required values:

```bash
cp env.example .env.local
```

### Required Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (for admin functions)
- `OPENAI_API_KEY`: Your OpenAI API key

### Optional Variables

- `REDIS_URL`: Redis connection string (for production caching)
- `NEXT_PUBLIC_APP_URL`: Your application URL

## Database Setup

1. Run the database migrations in your Supabase project:

```sql
-- Run the main schema
\i supabase/schema.sql

-- Run the optimization indexes
\i migrations/database_optimization.sql
```

2. Create an admin user by updating a user's role in the database:

```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect your repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables in Vercel dashboard

2. **Set environment variables in Vercel**
   - Go to Project Settings > Environment Variables
   - Add all required environment variables
   - Use Vercel's secure environment variable storage

3. **Deploy**
   - Vercel will automatically deploy on every push to main branch
   - Custom domains can be configured in Project Settings

### Option 2: Docker Deployment

1. **Build the Docker image**
   ```bash
   docker build -t workify .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Configure reverse proxy (Nginx)**
   - Update `nginx.conf` with your domain
   - Set up SSL certificates
   - Configure DNS to point to your server

### Option 3: Traditional VPS

1. **Install dependencies**
   ```bash
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2 for process management
   npm install -g pm2
   ```

2. **Deploy the application**
   ```bash
   # Clone repository
   git clone <your-repo-url>
   cd workify

   # Install dependencies
   npm install

   # Build the application
   npm run build

   # Start with PM2
   pm2 start npm --name "workify" -- start
   pm2 save
   pm2 startup
   ```

3. **Configure Nginx**
   ```bash
   # Install Nginx
   sudo apt install nginx

   # Copy nginx configuration
   sudo cp nginx.conf /etc/nginx/sites-available/workify
   sudo ln -s /etc/nginx/sites-available/workify /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Security Configuration

### 1. Supabase Security

- Enable Row Level Security (RLS) on all tables
- Configure proper RLS policies
- Use service role key only for admin operations
- Regularly rotate API keys

### 2. Environment Security

- Never commit `.env` files to version control
- Use secure environment variable storage
- Rotate API keys regularly
- Monitor API usage

### 3. Application Security

- Rate limiting is configured for all API endpoints
- Input validation on all user inputs
- CORS properly configured
- Security headers enabled

## Performance Optimization

### 1. Caching

- OpenAI responses are cached for 30-60 minutes
- User data is cached for 10 minutes
- Analytics data is cached for 5 minutes
- For production, consider using Redis for distributed caching

### 2. Database Optimization

- Indexes are created for common queries
- Query optimization for large datasets
- Connection pooling configured

### 3. CDN and Static Assets

- Static assets are served with proper cache headers
- Images are optimized
- Bundle size is minimized

## Monitoring and Maintenance

### 1. Application Monitoring

- Set up error tracking (Sentry, LogRocket)
- Monitor API response times
- Track user engagement metrics

### 2. Database Monitoring

- Monitor query performance
- Set up alerts for slow queries
- Regular database maintenance

### 3. Security Monitoring

- Monitor failed login attempts
- Track API usage patterns
- Set up alerts for suspicious activity

## Backup Strategy

### 1. Database Backups

- Enable automatic backups in Supabase
- Test restore procedures regularly
- Keep multiple backup copies

### 2. Application Backups

- Version control for all code
- Environment variable backups
- Configuration file backups

## Scaling Considerations

### 1. Horizontal Scaling

- Use load balancers for multiple instances
- Implement session management
- Use external Redis for caching

### 2. Database Scaling

- Consider read replicas for analytics
- Implement connection pooling
- Monitor database performance

### 3. API Rate Limits

- Adjust rate limits based on usage
- Implement user-based rate limiting
- Monitor API usage patterns

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Check variable names match exactly
   - Ensure variables are set in deployment platform
   - Restart application after adding variables

2. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Verify RLS policies

3. **OpenAI API Issues**
   - Check API key validity
   - Monitor rate limits
   - Verify API quota

### Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test database connectivity
4. Monitor API usage

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Admin user created
- [ ] SSL certificates installed
- [ ] Domain configured
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Error tracking enabled
