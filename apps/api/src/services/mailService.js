import nodemailer from "nodemailer";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let transporter = null;

const initializeMailer = () => {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const enableEmail = process.env.ENABLE_EMAIL === "true";

  if (!enableEmail || !smtpHost || !smtpUser || !smtpPass) {
    console.warn("Mail service disabled: SMTP config incomplete or ENABLE_EMAIL=false");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  return transporter;
};

/**
 * Send NDA signing link email to candidate
 */
export const sendNdaSigningEmail = async (candidateEmail, candidateName, ndaLink) => {
  try {
    const mailer = initializeMailer();
    if (!mailer) {
      console.log("[DEMO] Would send NDA email to:", candidateEmail);
      return { success: true, demo: true };
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@internflow.com",
      to: candidateEmail,
      subject: "Please Sign Your NDA - InternFlow",
      html: `
        <h2>Welcome, ${candidateName}!</h2>
        <p>Your internship journey is progressing. Please review and sign your Non-Disclosure Agreement (NDA).</p>
        <p><a href="${ndaLink}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Sign NDA</a></p>
        <p>If you have any questions, please contact our HR team.</p>
        <hr>
        <p><small>InternFlow - Internship Management System</small></p>
      `
    };

    const info = await mailer.sendMail(mailOptions);
    console.log("NDA email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending NDA email:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send offer letter to candidate
 */
export const sendOfferLetterEmail = async (candidateEmail, candidateName, pdfBuffer, fileName) => {
  try {
    const mailer = initializeMailer();
    if (!mailer) {
      console.log("[DEMO] Would send offer letter to:", candidateEmail);
      return { success: true, demo: true };
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@internflow.com",
      to: candidateEmail,
      subject: "Your Internship Offer Letter - InternFlow",
      html: `
        <h2>Congratulations, ${candidateName}!</h2>
        <p>We are pleased to extend an internship offer to you. Your offer letter is attached.</p>
        <p>Please review it carefully and let us know if you have any questions.</p>
        <hr>
        <p><small>InternFlow - Internship Management System</small></p>
      `,
      attachments: [
        {
          filename: fileName || "offer-letter.pdf",
          content: pdfBuffer,
          contentType: "application/pdf"
        }
      ]
    };

    const info = await mailer.sendMail(mailOptions);
    console.log("Offer letter email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending offer letter email:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send internship certificate to candidate
 */
export const sendCertificateEmail = async (candidateEmail, candidateName, pdfBuffer, fileName) => {
  try {
    const mailer = initializeMailer();
    if (!mailer) {
      console.log("[DEMO] Would send certificate to:", candidateEmail);
      return { success: true, demo: true };
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@internflow.com",
      to: candidateEmail,
      subject: "Your Internship Certificate - InternFlow",
      html: `
        <h2>Congratulations on Completing Your Internship!</h2>
        <p>Dear ${candidateName},</p>
        <p>We are delighted to inform you that you have successfully completed your internship program. Your certificate of completion is attached.</p>
        <p>Thank you for your hard work and dedication.</p>
        <hr>
        <p><small>InternFlow - Internship Management System</small></p>
      `,
      attachments: [
        {
          filename: fileName || "internship-certificate.pdf",
          content: pdfBuffer,
          contentType: "application/pdf"
        }
      ]
    };

    const info = await mailer.sendMail(mailOptions);
    console.log("Certificate email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending certificate email:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send generic email
 */
export const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    const mailer = initializeMailer();
    if (!mailer) {
      console.log("[DEMO] Would send email to:", to, "Subject:", subject);
      return { success: true, demo: true };
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@internflow.com",
      to,
      subject,
      html,
      attachments
    };

    const info = await mailer.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error.message);
    return { success: false, error: error.message };
  }
};
