import { loginSchema, registrationSchema } from '../schemas';

describe('email authentication validation', () => {
  it('requires a valid registration and a 12 character password', () => {
    expect(registrationSchema.safeParse({ displayName: 'Jo', email: 'jo@example.com', password: 'long-password' }).success).toBe(true);
    expect(registrationSchema.safeParse({ displayName: 'Jo', email: 'bad', password: 'short' }).success).toBe(false);
  });
  it('validates login input without imposing registration password length', () => {
    expect(loginSchema.safeParse({ email: 'jo@example.com', password: 'existing' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'wrong', password: '' }).success).toBe(false);
  });
});
