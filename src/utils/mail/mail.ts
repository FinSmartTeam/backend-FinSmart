import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import {
  EMAIL_SMTP_SERVICE_NAME,
  EMAIL_SMTP_HOST,
  EMAIL_SMTP_PORT,
  EMAIL_SMTP_SECURE,
  EMAIL_SMTP_USER,
  EMAIL_SMTP_PASS
} from "../env";

const transporter = nodemailer.createTransport({
  service: EMAIL_SMTP_SERVICE_NAME,
  host: EMAIL_SMTP_HOST,
  port: Number(EMAIL_SMTP_PORT),
  secure: EMAIL_SMTP_SECURE,
  auth: {
    user: EMAIL_SMTP_USER,
    pass: EMAIL_SMTP_PASS,
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