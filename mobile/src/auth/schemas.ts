import { z } from 'zod';

export const loginSchema = z.object({ email: z.email('Enter a valid email address.'), password: z.string().min(1, 'Enter your password.') });
export const registrationSchema = z.object({
  displayName: z.string().trim().min(2, 'Enter your name.').max(120).optional(),
  firstName: z.string().trim().min(2, 'Enter your first name.').max(60).optional(),
  lastName: z.string().trim().min(2, 'Enter your last name.').max(60).optional(),
  email: z.email('Enter a valid email address.'),
  password: z.string().min(12, 'Use at least 12 characters.').max(128),
  confirmPassword: z.string().optional(),
  phone: z.string().trim().max(40).optional(),
}).superRefine((value, context) => {
  const hasFullName = Boolean(value.firstName?.trim() && value.lastName?.trim());
  if (!hasFullName && !value.displayName?.trim()) context.addIssue({ code: 'custom', path: ['firstName'], message: 'Enter your first and last name.' });
  if (value.confirmPassword !== undefined && value.password !== value.confirmPassword) context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match.' });
});

export const registrationFormSchema = z.object({
  firstName: z.string().trim().min(2, 'Enter your first name.').max(60),
  lastName: z.string().trim().min(2, 'Enter your last name.').max(60),
  email: z.email('Enter a valid email address.'),
  password: z.string().min(12, 'Use at least 12 characters.').max(128),
  confirmPassword: z.string().min(1, 'Confirm your password.'),
  phone: z.string().trim().max(40).optional(),
}).refine((value) => value.password === value.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' });
