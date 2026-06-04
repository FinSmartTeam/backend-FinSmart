import dotenv from "dotenv";

dotenv.config();
export const SUPABASE_URL: string = process.env.DATABASE_URL || "";
export const SUPABASE_ANON_KEY: string = process.env.SUPABASE_ANON_KEY || "";
export const SUPABASE_SERVICE_ROLE_KEY: string = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const DATABASE_URL: string = process.env.DATABASE_URL || "";
export const DATABASE_PASSWORD: string = process.env.DATABASE_PASSWORD || "";
export const JWT_SECRET: string = process.env.JWT_SECRET || "";

export const AI_SERVICE_URL: string = process.env.AI_SERVICE_URL || "";
export const GOOGLE_CLIENT_ID: string = process.env.GOOGLE_CLIENT_ID || "";

export const EMAIL_SMTP_SECURE: boolean =
  Boolean(process.env.EMAIL_SMTP_SECURE) || false;
export const EMAIL_SMTP_PASS: string = process.env.EMAIL_SMTP_PASS || "";
export const EMAIL_SMTP_USER: string = process.env.EMAIL_SMTP_USER || "";
export const EMAIL_SMTP_PORT: number =
  Number(process.env.EMAIL_SMTP_PORT) || 465;
export const EMAIL_SMTP_HOST: string = process.env.EMAIL_SMTP_HOST || "";
export const EMAIL_SMTP_SERVICE_NAME: string =
  process.env.EMAIL_SMTP_SERVICE_NAME || "";
export const CLIENT_HOST: string =
  process.env.CLIENT_HOST || "http://localhost:3000";

export const CLOUDINARY_CLOUD_NAME: string =
  process.env.CLOUDINARY_CLOUD_NAME || "";
export const CLOUDINARY_API_KEY: string = process.env.CLOUDINARY_API_KEY || "";
export const CLOUDINARY_API_SECRET: string =
  process.env.CLOUDINARY_API_SECRET || "";