import { z } from 'zod';

// User validation schemas
export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: z.enum(['user', 'admin']).default('user'),
  is_active: z.boolean().default(true)
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  role: z.enum(['user', 'admin']).optional(),
  is_active: z.boolean().optional()
});

// Job validation schemas
export const jobSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(200, 'Title too long'),
  company: z.string().min(1, 'Company name is required').max(200, 'Company name too long'),
  description: z.string().min(10, 'Job description must be at least 10 characters').max(10000, 'Description too long')
});

// Application validation schemas
export const applicationSchema = z.object({
  tailorId: z.string().uuid('Invalid tailor ID'),
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'Action must be either approve or reject' })
  })
});

export const updateApplicationSchema = z.object({
  status: z.enum(['submitted', 'reviewed', 'interviewed', 'accepted', 'rejected']),
  admin_notes: z.string().max(1000, 'Admin notes too long').optional()
});

// Intent validation schemas
export const intentSchema = z.object({
  roles: z.array(z.string().max(100, 'Role name too long')).min(1, 'At least one role is required'),
  dream_companies: z.array(z.string().max(100, 'Company name too long')).optional(),
  locations: z.array(z.string().max(100, 'Location name too long')).optional(),
  work_type: z.enum(['remote', 'hybrid', 'onsite']).optional()
});

// Profile validation schemas
export const profileSchema = z.object({
  master_resume_text: z.string().min(10, 'Resume text must be at least 10 characters').max(50000, 'Resume too long'),
  skills: z.array(z.string().max(100, 'Skill name too long')).optional(),
  education: z.array(z.object({
    institution: z.string().max(200, 'Institution name too long'),
    degree: z.string().max(200, 'Degree name too long'),
    year: z.number().min(1900).max(new Date().getFullYear() + 10)
  })).optional(),
  experience: z.array(z.object({
    company: z.string().max(200, 'Company name too long'),
    position: z.string().max(200, 'Position name too long'),
    start_date: z.string(),
    end_date: z.string().optional(),
    description: z.string().max(2000, 'Experience description too long')
  })).optional()
});

// API request validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50)
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'Start date must be before end date',
  path: ['endDate']
});

// Input sanitization functions
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, ''); // Remove javascript: protocol
}

// Rate limiting validation
export function validateRateLimit(ip: string, endpoint: string): boolean {
  // This would integrate with your rate limiting system
  // For now, just return true
  return true;
}

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  mimetype: z.enum(['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB') // 10MB limit
});

// Error handling utilities
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function handleValidationError(error: z.ZodError): { message: string; field?: string }[] {
  return error.errors.map(err => ({
    message: err.message,
    field: err.path.join('.')
  }));
}

// Security validation
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}
