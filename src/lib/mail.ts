import nodemailer from "nodemailer";
import { EMAIL_TEMPLATE } from "./legal-text";

// Configure com seu provedor (Gmail, Resend, AWS SES, etc)
// Para testar, recomendo criar uma conta no Ethereal.email se não tiver SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  secure: true, // true para 465, false para outras portas
});

export async function sendWelcomeEmailWithTerms(email: string, username: string) {
  try {
    const info = await transporter.sendMail({
      from: '"Gato Comics" <noreply@gatocomics.com.br>',
      to: email,
      subject: "Bem-vindo ao Gato Comics - Cópia dos Termos",
      html: EMAIL_TEMPLATE(username),
    });
    
    console.log("Email de termos enviado: %s", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return { success: false }; // Não queremos quebrar o registro se o email falhar
  }
}