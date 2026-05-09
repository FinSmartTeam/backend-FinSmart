import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SMTP_SERVICE_NAME,
  host: process.env.EMAIL_SMTP_HOST,
  port: Number(process.env.EMAIL_SMTP_PORT) || 465,
  secure: process.env.EMAIL_SMTP_SECURE === "true" || true,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASS,
  },
  requireTLS: true,
});

export interface ISendMail {
  from?: string;
  to: string;
  subject: string;
  html: string;
}

export const sendMail = async ({ ...mailParams }: ISendMail) => {
  const result = await transporter.sendMail({
    ...mailParams,
  });
  return result;
};

export const renderMailHtml = async (
  template: string,
  data: any,
): Promise<string> => {
  const content = await ejs.renderFile(
    path.join(__dirname, `templates/${template}`),
    data,
  );
  return content as string;
};

export const sendOtpEmail = async (email: string, fullName: string, otp: string) => {
  try {
    const templatePath = path.join(__dirname, "templates/registration-succes.ejs");
    const html = await ejs.renderFile(templatePath, { fullName, email, otp });

    const mailOptions = {
      from: process.env.EMAIL_SMTP_USER,
      to: email,
      subject: "FinSmart Account Activation",
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send OTP email");
  }
};