# Workify - Resume Tailoring Application

## Overview

Workify is a comprehensive Next.js application that helps job seekers tailor their resumes to specific job descriptions using AI. The application uses OpenAI's GPT-4-turbo and embedding models to analyze resumes, calculate fit scores, and generate tailored content with advanced admin features, caching, and security measures.

## Features

### Core Features
- **User Authentication**: Secure authentication with Supabase Auth
- **Resume Upload & Parsing**: Support for PDF and text file uploads
- **Job Search Preferences**: Customizable job search intent setup
- **AI-Powered Tailoring**: GPT-4 powered resume, cover letter, and portfolio generation
- **Fit Score Calculation**: Semantic similarity scoring using OpenAI embeddings
- **Application Tracking**: Complete application lifecycle management

### Applicant Feedback Analytics
- **Probability Scoring**: AI-predicted likelihood of selection (0-100%)
- **Detailed Insights**: Comprehensive analysis of strengths, gaps, and recommendations
- **Scoring Model**: Weighted algorithm combining semantic similarity (60%), skill coverage (30%), and experience alignment (10%)
- **Real-time Feedback**: Immediate feedback generation after job processing
- **Visual Analytics**: Progress bars, badges, and color-coded insights for easy understanding

### Admin Features
- **Admin Dashboard**: Comprehensive admin interface for user and application management
- **User Management**: Role-based access control with user status management
- **Feedback Analytics**: System-wide analytics on application success rates, common strengths, and improvement areas
- **Analytics**: Real-time analytics and reporting
- **Application Oversight**: Track and manage all user applications

### Performance & Security
- **Rate Limiting**: API endpoint protection against abuse
- **Caching System**: Intelligent caching for OpenAI responses and database queries
- **Input Validation**: Comprehensive input sanitization and validation
- **Security Headers**: Production-ready security configurations
- **Database Optimization**: Indexed queries and performance optimizations

### Deployment Ready
- **Multi-Platform Support**: Vercel, Docker, and traditional VPS deployment options
- **Environment Configuration**: Secure environment variable management
- **Production Optimizations**: Built-in performance and security optimizations

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- OpenAI API key

### Environment Variables

Copy `env.example` to `.env.local` and configure the following variables:

```bash
cp env.example .env.local
```

Required variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

Optional variables:
```
REDIS_URL=your_redis_url (for production caching)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

1. Create a new Supabase project
2. Run the migration scripts in order:

```sql
-- Run these in the Supabase SQL editor
-- 1. First run the main schema
\i supabase/schema.sql

-- 2. Then run the optimization indexes
\i migrations/database_optimization.sql
```

3. Create an admin user:
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/workify.git
cd workify

# Install dependencies
npm install

# Run the development server
npm run dev
```

## Usage Flow

1. **User Registration/Login**: Users create an account or log in
2. **Resume Upload**: Users upload their resume (PDF/TXT)
3. **Job Search Preferences**: Users set their job search preferences
4. **Job Description Input**: Users add job descriptions they want to apply for
5. **AI Processing**: The system calculates fit scores and generates tailored content
6. **Review and Approval**: Users review and approve the tailored content
7. **Application Tracking**: The system tracks application status

## Technical Architecture

### Frontend
- Next.js 14 (React framework)
- Tailwind CSS for styling

### Backend
- Next.js API routes (serverless functions)
- Supabase for authentication and database
- OpenAI API for AI capabilities

### Database Schema

- **users**: Managed by Supabase Auth
- **profiles**: User profile information and resume text
- **intents**: Job search preferences
- **jobs**: Job descriptions
- **tailors**: AI-generated tailored content
- **applications**: Approved applications

## API Routes

### Core API Routes
- `/api/jobs/create`: Create a new job
- `/api/jobs/process/[id]`: Process a job with AI (rate limited)
- `/api/applications`: Approve or reject tailored content

### Admin API Routes
- `/api/admin/users`: User management (admin only)
- `/api/admin/analytics`: System analytics (admin only)

## Admin Dashboard

Access the admin dashboard at `/admin` (admin role required). Features include:

- **User Management**: View, edit, and manage user accounts
- **Application Tracking**: Monitor all job applications
- **Analytics**: View system statistics and user growth
- **Role Management**: Assign admin roles to users

## Testing the Feedback System

### User Flow Testing
1. **Sign up** for a new account
2. **Upload a resume** (PDF or text file)
3. **Set job search preferences** (roles, companies, locations)
4. **Add a job description** by pasting any job posting
5. **Process the job** - this will generate tailored content AND feedback
6. **View feedback** in the "Application Feedback" tab on your dashboard

### Feedback Features to Test
- **Probability Score**: Check that the selection probability is displayed (0-100%)
- **Scoring Breakdown**: Verify semantic similarity, skill coverage, and experience alignment scores
- **Strengths Section**: Look for green-highlighted strengths with confidence scores
- **Gaps Section**: Check for yellow-highlighted improvement areas with severity levels
- **Recommendations**: Review actionable recommendations with priority levels

### Admin Testing
1. **Access admin dashboard** at `/admin` (requires admin role)
2. **Navigate to "Feedback Analytics" tab**
3. **View system-wide metrics**:
   - Total feedback count
   - Average selection probability
   - High success rate percentage
4. **Review analytics**:
   - Top strengths across all applications
   - Common improvement areas
   - Recent feedback with scores

### Database Verification
Run these SQL queries in Supabase to verify feedback data:
```sql
-- Check feedback table structure
SELECT * FROM feedback LIMIT 5;

-- View feedback analytics
SELECT * FROM get_system_feedback_analytics(3);

-- Check user feedback stats
SELECT * FROM get_user_feedback_stats('user-uuid-here', 3);
```

## Deployment

### Quick Deploy to Vercel

1. Fork this repository
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

### Docker Deployment

```bash
docker-compose up -d
```

### Traditional VPS

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Comprehensive input sanitization
- **Row Level Security**: Database-level access control
- **Admin Authentication**: Role-based admin access
- **Security Headers**: Production-ready security configurations

## Performance Features

- **Intelligent Caching**: OpenAI responses cached for 30-60 minutes
- **Database Indexes**: Optimized queries for better performance
- **Rate Limiting**: Prevents system overload
- **Static Optimization**: Next.js production optimizations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT