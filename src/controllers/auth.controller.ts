import { Request, Response } from "express";
import * as Yup from "yup";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq, or } from "drizzle-orm";
import { db } from "../lib/db";
import { users } from "../models/user.model";
import { sendOtpEmail } from "../utils/mail/mail";
import response from "../utils/response";
import { IReqUser } from "../utils/interface";
import uploader from "../utils/uploader";
import { v2 as cloudinary } from "cloudinary";

type TRegister = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type TLogin = {
  email: string;
  password: string;
};

const registerValidateSchema = Yup.object({
  fullName: Yup.string().required(),
  username: Yup.string().required(),
  email: Yup.string().required(),
  password: Yup.string()
    .required()
    .min(6, "Password must be at least 6 characters")
    .test(
      "at-least-one-upercase-letter",
      "Password must contain at least one uppercase letter",
      (value) => {
        if (!value) return false;
        const regex = /^(?=.*[A-Z])/;
        return regex.test(value);
      },
    )
    .test("at-least-one-number", "Contains at least one number", (value) => {
      if (!value) return false;
      const regex = /^(?=.*\d)/;
      return regex.test(value);
    }),
  confirmPassword: Yup.string()
    .required()
    .oneOf([Yup.ref("password")], "Passwords must match"),
});

export default {
  async register(req: Request, res: Response) {
    /**
      #swagger.tags = ["Auth"]
      #swagger.summary = "Register a new user"
      #swagger.description = "Endpoint to register a new user. It will send a 6-digit OTP to the user's email for activation."
      #swagger.requestBody = {
        required: true,
        schema: { $ref: "#/components/schemas/RegisterRequest" }
      }
     */
    const { fullName, username, email, password, confirmPassword } =
      req.body as unknown as TRegister;

    try {
      await registerValidateSchema.validate({
        fullName,
        username,
        email,
        password,
        confirmPassword,
      });

      const existingUsers = await db
        .select()
        .from(users)
        .where(or(eq(users.email, email), eq(users.username, username)));

      if (existingUsers.length > 0) {
        return res.status(409).json({
          meta: { status: 409, message: "Email or Username already exists" },
          data: null,
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const activationCode = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();

      const [newUser] = await db
        .insert(users)
        .values({
          fullName,
          username,
          email,
          password: hashedPassword,
          activationCode,
        })
        .returning({
          id: users.id,
          email: users.email,
          fullName: users.fullName,
        });

      await sendOtpEmail(newUser.email, newUser.fullName, activationCode);

      response.success(
        res,
        newUser,
        "User registered successfully. Please check your email for the activation code.",
      );
    } catch (error) {
      response.error(res, error, "Failed to register user");
    }
  },

  async login(req: Request, res: Response) {
    /**
      #swagger.tags = ["Auth"]
      #swagger.summary = "Login a user"
      #swagger.description = "Login to the application using email and password. Requires the account to be activated via OTP first."
      #swagger.requestBody = {
       required:true,
       schema: {$ref: "#/components/schemas/LoginRequest"}
      }
     */
    const { email, password } = req.body as unknown as TLogin;

    try {
      if (!email || !password) {
        return response.unauthorized(res, "Email and password are required");
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user) {
        return response.unauthorized(res, "Invalid credentials");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return response.unauthorized(res, "Invalid credentials");
      }

      if (!user.isActive) {
        return response.unauthorized(
          res,
          "Account is not activated. Please check your email for OTP.",
        );
      }

      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
      );

      const payload = {
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
        },
      };

      response.success(res, payload, "Login successful");
    } catch (error) {
      response.error(res, error, "Failed to login");
    }
  },

  async me(req: Request, res: Response) {
    /**
      #swagger.tags = ["Auth"]
      #swagger.summary = "Get current user profile"
      #swagger.description = "Fetch the profile data of the currently authenticated user using JWT Bearer token."
      #swagger.security = [{
        "bearerAuth": []
      }]
     */
    try {
      const userReq = (req as IReqUser).user;
      if (!userReq) {
        return response.unauthorized(res, "User not found in request");
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userReq.id));

      if (!user) {
        return response.unauthorized(res, "Invalid token or user not found");
      }

      const userProfile = {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      };

      response.success(res, userProfile, "User profile fetched successfully");
    } catch (error) {
      response.error(res, error, "Failed to fetch user profile");
    }
  },

  async activation(req: Request, res: Response) {
    /**
      #swagger.tags = ["Auth"]
      #swagger.summary = "Activate user account via OTP"
      #swagger.description = "Activate a newly registered account by verifying the 6-digit OTP sent to their email."
      #swagger.requestBody = {
        required: true,
        schema: {
          $ref: "#/components/schemas/ActivationRequest"
        }
      }
    */
    try {
      const { code, email } = req.body as { code: string; email: string };

      if (!code || !email) {
        return res.status(400).json({
          meta: { status: 400, message: "Email and code are required" },
          data: null,
        });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user) {
        return res.status(404).json({
          meta: { status: 404, message: "User not found" },
          data: null,
        });
      }

      if (user.isActive) {
        return res.status(400).json({
          meta: { status: 400, message: "Account is already active" },
          data: null,
        });
      }

      if (user.activationCode !== code) {
        return res.status(400).json({
          meta: { status: 400, message: "Invalid activation code" },
          data: null,
        });
      }

      await db
        .update(users)
        .set({
          isActive: true,
          activationCode: null,
        })
        .where(eq(users.id, user.id));

      response.success(
        res,
        null,
        "Account successfully activated. You can now login.",
      );
    } catch (error) {
      response.error(res, error, "Failed to activate user");
    }
  },

  async updateProfile(req: Request, res: Response) {
    /**
      #swagger.tags = ["Auth"]
      #swagger.summary = "Update user profile"
      #swagger.description = "Update the currently authenticated user's profile (name, password, and profile picture). Supports multipart/form-data."
      #swagger.security = [{
        "bearerAuth": []
      }]
      #swagger.consumes = ['multipart/form-data']
      #swagger.parameters['fullName'] = { in: 'formData', type: 'string', description: 'Full name of the user' }
      #swagger.parameters['password'] = { in: 'formData', type: 'string', description: 'New password (optional)' }
      #swagger.parameters['profilePicture'] = { in: 'formData', type: 'file', description: 'Profile picture image' }
     */
    try {
      const userReq = (req as IReqUser).user;
      if (!userReq) {
        return response.unauthorized(res, "User not found in request");
      }

      const { fullName, password } = req.body;
      const file = req.file;

      const updateData: any = {};

      if (fullName) {
        updateData.fullName = fullName;
      }

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      if (file) {
        const uploadResult = await uploader.uploadSingle(file);
        const optimizedUrl = cloudinary.url(uploadResult.public_id, {
          quality: "auto",
          fetch_format: "auto",
          width: 800,
          crop: "scale",
          secure: true,
        });
        updateData.profilePicture = optimizedUrl || uploadResult.secure_url;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          meta: { status: 400, message: "No fields to update" },
          data: null,
        });
      }

      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userReq.id))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({
          meta: { status: 404, message: "User not found" },
          data: null,
        });
      }

      const userProfile = {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        profilePicture: updatedUser.profilePicture,
      };

      response.success(res, userProfile, "Profile updated successfully");
    } catch (error) {
      console.error("[Update Profile Error]:", error);
      response.error(res, error, "Failed to update profile");
    }
  },
};
