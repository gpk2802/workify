-- Seed data for Workify MVP

-- Sample users (passwords would be managed through Supabase Auth)
-- Note: In a real implementation, users would be created through the auth system
-- These are just placeholders for the seed data
INSERT INTO public.users (id, email, name, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'demo@example.com', 'Demo User', NOW()),
  ('00000000-0000-0000-0000-000000000002', 'admin@example.com', 'Admin User', NOW());

-- Sample profile for demo user
INSERT INTO public.profiles (id, user_id, master_resume_text, skills, education, experience, profile_hash) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 
  'John Doe
johndoe@example.com | (555) 123-4567 | linkedin.com/in/johndoe

SUMMARY
Experienced software engineer with 5+ years of experience in full-stack development, specializing in React, Node.js, and cloud technologies. Passionate about creating scalable and user-friendly applications.

SKILLS
- Programming Languages: JavaScript, TypeScript, Python, SQL
- Frontend: React, Redux, HTML5, CSS3, Tailwind CSS
- Backend: Node.js, Express, REST APIs, GraphQL
- Databases: PostgreSQL, MongoDB, Redis
- Cloud: AWS, Azure, Docker, Kubernetes
- Tools: Git, GitHub, JIRA, Figma

EXPERIENCE
Senior Software Engineer | TechCorp Inc. | Jan 2020 - Present
- Led development of a customer-facing portal that increased user engagement by 35%
- Implemented CI/CD pipelines that reduced deployment time by 50%
- Mentored junior developers and conducted code reviews
- Optimized database queries resulting in 40% faster load times

Software Engineer | WebSolutions LLC | Mar 2018 - Dec 2019
- Developed responsive web applications using React and Node.js
- Collaborated with UX designers to implement user-friendly interfaces
- Integrated third-party APIs for payment processing and data analytics

Junior Developer | StartupXYZ | Jun 2016 - Feb 2018
- Assisted in building MVP for a social media analytics platform
- Fixed bugs and implemented new features based on user feedback
- Participated in daily stand-ups and sprint planning

EDUCATION
Bachelor of Science in Computer Science | University of Technology | 2016
- GPA: 3.8/4.0
- Relevant coursework: Data Structures, Algorithms, Database Systems, Web Development

CERTIFICATIONS
- AWS Certified Developer - Associate
- MongoDB Certified Developer
- Certified Scrum Master',
  
  '{"languages": ["JavaScript", "TypeScript", "Python", "SQL"], "frameworks": ["React", "Node.js", "Express"], "tools": ["Git", "Docker", "AWS"]}',
  
  '[{"degree": "Bachelor of Science in Computer Science", "institution": "University of Technology", "year": "2016", "gpa": "3.8/4.0"}]',
  
  '[{"title": "Senior Software Engineer", "company": "TechCorp Inc.", "startDate": "2020-01", "endDate": "Present", "description": "Led development of customer-facing portal and implemented CI/CD pipelines."}, {"title": "Software Engineer", "company": "WebSolutions LLC", "startDate": "2018-03", "endDate": "2019-12", "description": "Developed responsive web applications using React and Node.js."}, {"title": "Junior Developer", "company": "StartupXYZ", "startDate": "2016-06", "endDate": "2018-02", "description": "Assisted in building MVP for a social media analytics platform."}]',
  
  'demo-profile-hash-123');

-- Sample intent for demo user
INSERT INTO public.intents (id, user_id, roles, dream_companies, locations, work_type) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
  '["Software Engineer", "Full Stack Developer", "Frontend Engineer"]',
  '["Google", "Microsoft", "Airbnb", "Stripe"]',
  '["San Francisco, CA", "Seattle, WA", "Remote"]',
  'hybrid');

-- Sample job description
INSERT INTO public.jobs (id, user_id, user_submitted_url, job_description_text, job_parsed_meta) VALUES
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
  'https://example.com/job/12345',
  'Senior Frontend Engineer

About Us:
We are a fast-growing tech company building innovative solutions for the modern web. Our team is passionate about creating exceptional user experiences and pushing the boundaries of what's possible on the web.

Responsibilities:
- Design, develop, and maintain complex frontend applications using React and TypeScript
- Collaborate with designers, product managers, and backend engineers to deliver high-quality features
- Optimize application performance and ensure cross-browser compatibility
- Write clean, maintainable, and well-tested code
- Participate in code reviews and provide constructive feedback
- Stay up-to-date with emerging trends and technologies in frontend development

Requirements:
- 5+ years of experience in frontend development
- Strong proficiency in JavaScript, TypeScript, HTML, and CSS
- Expert knowledge of React and state management libraries (Redux, MobX, etc.)
- Experience with modern frontend build tools (Webpack, Babel, etc.)
- Familiarity with responsive design and cross-browser compatibility
- Strong problem-solving skills and attention to detail
- Excellent communication and collaboration skills
- BS/MS in Computer Science or related field (or equivalent experience)

Nice to Have:
- Experience with Next.js or similar frameworks
- Knowledge of GraphQL and Apollo Client
- Experience with testing frameworks (Jest, React Testing Library)
- Contributions to open-source projects
- Experience with CI/CD pipelines

Benefits:
- Competitive salary and equity package
- Health, dental, and vision insurance
- Flexible work arrangements
- Professional development budget
- Regular team events and activities

Location: San Francisco, CA (Hybrid)',
  
  '{"title": "Senior Frontend Engineer", "company": "Example Tech", "location": "San Francisco, CA", "workType": "Hybrid", "keySkills": ["React", "TypeScript", "JavaScript", "Frontend"]}');

-- Sample tailor result
INSERT INTO public.tailors (id, user_id, job_id, fit_score, generated_resume_text, cover_letter_text, portfolio_text, prompt_version, tokens_estimate, cached_hash, created_at) VALUES
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
  85,
  'John Doe
johndoe@example.com | (555) 123-4567 | linkedin.com/in/johndoe

SUMMARY
Senior Frontend Engineer with 5+ years of experience in building complex web applications using React, TypeScript, and modern frontend technologies. Passionate about creating exceptional user experiences with a focus on performance optimization and cross-browser compatibility.

SKILLS
- Frontend: React, Redux, TypeScript, HTML5, CSS3, Tailwind CSS
- Build Tools: Webpack, Babel, ESLint
- Testing: Jest, React Testing Library
- Performance: Lighthouse, Web Vitals, Bundle optimization
- Collaboration: Git, GitHub, JIRA, Figma

EXPERIENCE
Senior Software Engineer | TechCorp Inc. | Jan 2020 - Present
- Led development of a customer-facing React portal that increased user engagement by 35%
- Implemented TypeScript across the frontend codebase, reducing bugs by 25%
- Optimized application performance, achieving a 40% improvement in load times
- Mentored junior developers on React best practices and component architecture
- Collaborated with designers to implement responsive, cross-browser compatible UIs

Software Engineer | WebSolutions LLC | Mar 2018 - Dec 2019
- Developed responsive web applications using React and modern JavaScript
- Built reusable component libraries that improved development efficiency by 30%
- Integrated GraphQL APIs for efficient data fetching and state management
- Implemented comprehensive test coverage using Jest and React Testing Library

Junior Developer | StartupXYZ | Jun 2016 - Feb 2018
- Assisted in building MVP for a social media analytics platform using React
- Implemented responsive designs ensuring cross-browser compatibility
- Participated in daily stand-ups and sprint planning

EDUCATION
Bachelor of Science in Computer Science | University of Technology | 2016
- GPA: 3.8/4.0
- Relevant coursework: Web Development, User Interface Design, Data Structures

CERTIFICATIONS
- Frontend Masters: Advanced React Patterns
- MongoDB Certified Developer',
  
  'John Doe
johndoe@example.com | (555) 123-4567

September 11, 2025

Hiring Manager
Example Tech
San Francisco, CA

Re: Senior Frontend Engineer Position

Dear Hiring Manager,

I am writing to express my strong interest in the Senior Frontend Engineer position at Example Tech. With over 5 years of experience developing sophisticated frontend applications using React and TypeScript, I am excited about the opportunity to contribute to your team's mission of creating exceptional user experiences and pushing the boundaries of what's possible on the web.

In my current role as a Senior Software Engineer at TechCorp Inc., I have led the development of complex customer-facing portals using React and TypeScript, resulting in a 35% increase in user engagement. I have extensive experience optimizing application performance, implementing responsive designs, and ensuring cross-browser compatibility—all key requirements mentioned in your job description.

My technical expertise closely aligns with your requirements:

- 5+ years of frontend development experience with strong proficiency in JavaScript, TypeScript, HTML, and CSS
- Expert knowledge of React and state management libraries including Redux
- Experience with modern build tools like Webpack and Babel
- Strong focus on writing clean, maintainable, and well-tested code

Additionally, I bring experience with Next.js and testing frameworks like Jest and React Testing Library, which you mentioned as nice-to-have qualifications.

I am particularly drawn to Example Tech because of your commitment to innovation and creating exceptional user experiences. I am confident that my technical skills, collaborative approach, and passion for frontend development would make me a valuable addition to your team.

I would welcome the opportunity to discuss how my background and skills would benefit Example Tech. Thank you for considering my application.

Sincerely,
John Doe',
  
  '# John Doe - Frontend Engineering Portfolio

## Professional Summary
Senior Frontend Engineer with 5+ years of experience specializing in React, TypeScript, and modern frontend technologies. Passionate about creating exceptional user experiences with a focus on performance and maintainability.

## Featured Projects

### Customer Portal Redesign | TechCorp Inc.
**Technologies:** React, TypeScript, Redux, Tailwind CSS

Led the complete redesign and development of the company's customer portal, serving over 50,000 active users.

**Key Achievements:**
- Increased user engagement by 35% through intuitive UI/UX improvements
- Reduced load time by 40% through code splitting and performance optimizations
- Implemented comprehensive test coverage with Jest and React Testing Library
- Designed a reusable component library that improved development efficiency

### Real-time Analytics Dashboard | WebSolutions LLC
**Technologies:** React, GraphQL, Apollo Client, D3.js

Developed a real-time analytics dashboard for monitoring business metrics and user behavior.

**Key Achievements:**
- Built efficient data visualization components using D3.js and React
- Implemented real-time updates using GraphQL subscriptions
- Created responsive layouts that work seamlessly across devices
- Optimized rendering performance for large datasets

### Social Media Analytics Platform | StartupXYZ
**Technologies:** React, Redux, CSS Modules

Contributed to the development of an MVP for a social media analytics platform.

**Key Achievements:**
- Implemented key features for data visualization and user interaction
- Ensured cross-browser compatibility and responsive design
- Collaborated with UX designers to create intuitive user interfaces

## Technical Skills

### Frontend Development
- **Languages:** JavaScript (ES6+), TypeScript, HTML5, CSS3
- **Frameworks/Libraries:** React, Redux, Next.js
- **Styling:** CSS-in-JS, Tailwind CSS, SASS
- **Build Tools:** Webpack, Babel, ESLint

### Testing & Quality
- Jest, React Testing Library
- Cypress for E2E testing
- Lighthouse performance auditing

### Development Practices
- Agile/Scrum methodology
- Git workflow and code reviews
- CI/CD implementation
- Performance optimization

## Education & Certifications
- **BS in Computer Science** - University of Technology (2016)
- **Frontend Masters: Advanced React Patterns**
- **MongoDB Certified Developer**

## Contact Information
Email: johndoe@example.com | Phone: (555) 123-4567 | LinkedIn: linkedin.com/in/johndoe',
  
  'v1.0',
  1200,
  'tailor-hash-123',
  NOW());

-- Sample application
INSERT INTO public.applications (id, tailor_id, user_id, status, method, outcome, admin_notes) VALUES
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
  'submitted', 'client-side-upload', NULL, NULL);