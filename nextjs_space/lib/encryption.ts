// Simple encryption utilities for API credentials
// In production, use proper encryption (e.g., AES-256 with a secure key from env)

const _ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "default-key-change-in-production";

export function encryptCredentials(
  credentials: Record<string, string>,
): Record<string, string> {
  const encrypted: Record<string, string> = {};
  for (const [key, value] of Object.entries(credentials)) {
    // Base64 encode with a marker prefix for simple obfuscation
    // In production, use proper encryption
    encrypted[key] = `enc:${Buffer.from(value).toString("base64")}`;
  }
  return encrypted;
}

export function decryptCredentials(
  encrypted: Record<string, string>,
): Record<string, string> {
  const decrypted: Record<string, string> = {};
  for (const [key, value] of Object.entries(encrypted)) {
    if (typeof value === "string" && value.startsWith("enc:")) {
      decrypted[key] = Buffer.from(value.slice(4), "base64").toString("utf8");
    } else {
      decrypted[key] = value;
    }
  }
  return decrypted;
}

export function maskCredential(value: string): string {
  if (!value || value.length < 8) return "****";
  return value.slice(0, 4) + "****" + value.slice(-4);
}

export function maskCredentials(
  credentials: Record<string, string>,
): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const [key, value] of Object.entries(credentials)) {
    masked[key] = maskCredential(value);
  }
  return masked;
}
