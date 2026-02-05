// MFA utilities
import * as crypto from 'crypto';

export function generateTOTPSecret(): string {
  return crypto.randomBytes(20).toString('base64').replace(/[^A-Z2-7]/gi, '').substring(0, 32);
}

export function generateQRCodeURI(secret: string, email: string, issuer: string = 'CortexBuild Pro'): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
}

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.substring(0, 4)}-${code.substring(4, 8)}`);
  }
  return codes;
}

export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code.replace('-', '')).digest('hex');
}

export function verifyTOTP(secret: string, token: string, _window: number = 1): boolean {
  // This is a placeholder - in production, use a library like 'otplib' or 'speakeasy'
  // For now, just verify the token format
  return /^\d{6}$/.test(token);
}

export function verifyBackupCode(hashedCodes: string[], code: string): boolean {
  const hashedInput = hashBackupCode(code);
  return hashedCodes.includes(hashedInput);
}
