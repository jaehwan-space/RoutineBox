import nodemailer from "nodemailer";
import { config, isProd } from "../config.js";

export interface MailMessage { to: string; subject: string; text: string; html?: string }

/** SMTP_HOST 가 있을 때만 실제 발송한다. 없으면(개발·테스트) 건너뛰고 false 를 돌려준다. */
const transport = config.SMTP_HOST
  ? nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS ?? "" } : undefined,
    })
  : null;

export const mailEnabled = (): boolean => transport !== null;

export async function sendMail(msg: MailMessage): Promise<boolean> {
  if (!transport) {
    if (!isProd && config.NODE_ENV !== "test") console.log(`[mail] (SMTP 미설정, 발송 건너뜀) → ${msg.to} · ${msg.subject}`);
    return false;
  }
  await transport.sendMail({ from: config.MAIL_FROM, to: msg.to, subject: msg.subject, text: msg.text, html: msg.html });
  return true;
}
