import nodemailer from "nodemailer";

/**
 * Receipt emails go out through the shop's own Gmail. Set in .env.local, then restart:
 *   GMAIL_USER=yourshop@gmail.com
 *   GMAIL_APP_PASSWORD=<16-character Google app password>
 * Without them nothing is sent and the admin gets a ready-made "Email it" link instead.
 */
export const emailConfigured = () => !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

export async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  const gmail = process.env.GMAIL_USER;
  const pass = (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s/g, "");
  try {
    if (gmail && pass) {
      const transport = nodemailer.createTransport({ service: "gmail", auth: { user: gmail, pass }, connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 12000 });
      await transport.sendMail({ from: `ADHZ Bike Repair & Service <${gmail}>`, to, subject, html });
      return { ok: true };
    }
    return { ok: false, error: "Email sending is not set up" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 160) : "Could not send" };
  }
}
