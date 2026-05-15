const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password',
  },
});

/**
 * Sends a welcome email to a new user.
 * @param {string} email - Recipient email.
 * @param {string} nome - Recipient name.
 * @param {string} password - Generated password.
 */
async function sendWelcomeEmail(email, nome, password) {
  try {
    const info = await transporter.sendMail({
      from: `"Sistema Scalabrianos" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Bem-vindo ao Sistema Scalabrianos - Primeiro Acesso",
      text: `Olá ${nome},\n\nSeu cadastro no Sistema Scalabrianos foi realizado com sucesso.\n\nPara o seu primeiro acesso, utilize as credenciais abaixo:\n\nE-mail: ${email}\nSenha: ${password}\n\nRecomendamos que você altere sua senha após o primeiro login.\n\nAtenciosamente,\nEquipe Scalabrianos`,
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Olá ${nome},</h2>
          <p>Seu cadastro no <strong>Sistema Scalabrianos</strong> foi realizado com sucesso.</p>
          <p>Para o seu primeiro acesso, utilize as credenciais abaixo:</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>E-mail:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Senha:</strong> ${password}</p>
          </div>
          <p>Recomendamos que você altere sua senha após o primeiro login.</p>
          <br/>
          <p>Atenciosamente,<br/>Equipe Scalabrianos</p>
        </div>
      `,
    });
    console.log("Email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

module.exports = { sendWelcomeEmail };
