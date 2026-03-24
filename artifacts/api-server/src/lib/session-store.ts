import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key-change-in-prod-32ch!!";
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

function getKey(): Buffer {
  const keyBuffer = Buffer.from(ENCRYPTION_KEY);
  if (keyBuffer.length < 32) {
    return Buffer.concat([keyBuffer, Buffer.alloc(32 - keyBuffer.length)]);
  }
  return keyBuffer.slice(0, 32);
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

const sessions = new Map<string, string>();

export function storeApiKey(sessionId: string, apiKey: string): void {
  sessions.set(sessionId, encrypt(apiKey));
}

export function getApiKey(sessionId: string): string | undefined {
  const encrypted = sessions.get(sessionId);
  if (!encrypted) return undefined;
  try {
    return decrypt(encrypted);
  } catch {
    return undefined;
  }
}

export function hasApiKey(sessionId: string): boolean {
  return sessions.has(sessionId);
}
