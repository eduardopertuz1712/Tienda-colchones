import nodemailer from "nodemailer";

/**
 * Envío de correo.
 *
 * Si hay SMTP configurado en el entorno se envía de verdad; si no, el
 * mensaje se registra en consola. Así el proyecto funciona en desarrollo
 * sin obligar a montar un servidor de correo, y pasa a enviar de verdad
 * solo con rellenar las variables.
 *
 * Variables necesarias:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM
 */

type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function isConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD,
  );
}

export async function sendMail(mail: Mail): Promise<"sent" | "logged"> {
  if (!isConfigured()) {
    console.log(
      [
        "",
        "──────────── CORREO NO ENVIADO (SMTP sin configurar) ────────────",
        `Para:    ${mail.to}`,
        `Asunto:  ${mail.subject}`,
        "",
        mail.text,
        "─────────────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );

    return "logged";
  }

  const port = Number(process.env.SMTP_PORT ?? 587);

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 es SMTP sobre TLS implícito; el resto usa STARTTLS.
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transport.sendMail({
    from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });

  return "sent";
}
