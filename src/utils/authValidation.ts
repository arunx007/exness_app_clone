const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_AUTH_PASSWORD_LENGTH = 8;

export type AuthFieldError =
  | 'requiredEmail'
  | 'invalidEmail'
  | 'requiredPassword'
  | 'invalidPassword'
  | 'requiredName'
  | 'invalidOtp';

export function normalizeEmail(value: string): string {
  return String(value || '').trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(normalizeEmail(value));
}

export function validateLoginCredentials(
  email: string,
  password: string,
): AuthFieldError | null {
  const normalized = normalizeEmail(email);
  if (!normalized) return 'requiredEmail';
  if (!isValidEmail(normalized)) return 'invalidEmail';
  if (!String(password || '').length) return 'requiredPassword';
  if (String(password).length < MIN_AUTH_PASSWORD_LENGTH) return 'invalidPassword';
  return null;
}

export function validateSignupCredentials(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): AuthFieldError | null {
  if (!input.firstName.trim() || !input.lastName.trim()) return 'requiredName';
  const loginError = validateLoginCredentials(input.email, input.password);
  return loginError;
}

export function validateOtpCode(otp: string): AuthFieldError | null {
  const code = String(otp || '').replace(/\D/g, '');
  if (code.length < 4) return 'invalidOtp';
  return null;
}
