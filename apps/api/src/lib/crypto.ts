import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { config } from "../config.js";

/** 빌링키 보관용 AES-256-GCM. 저장 형식: base64(iv).base64(tag).base64(ciphertext) */
function key(): Buffer {
  const hex = config.BILLING_KEY_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) throw new Error("BILLING_KEY_ENCRYPTION_KEY 는 32바이트 hex(64자)여야 합니다. openssl rand -hex 32");
  return Buffer.from(hex, "hex");
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}

export function decryptSecret(stored: string): string {
  const [iv, tag, enc] = stored.split(".").map((s) => Buffer.from(s, "base64"));
  if (!iv || !tag || !enc) throw new Error("암호문 형식이 올바르지 않습니다.");
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
