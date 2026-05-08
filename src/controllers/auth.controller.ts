import * as Yup from "yup";
import {Request,Response} from "express";
import { supabase } from "../lib/supabase";
import response from "../utils/response";
import { IReqUser } from "../utils/interface";

type TRegister ={
  fullName:string,
  username:string,
  email:string,
  password:string,
  confirmPassword:string
}

type TLogin ={
  identifier:string,
  password:string
}

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
})

export default {
  async register(req: Request, res: Response) {
    /**
      #swagger.tags = ["Auth"]
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

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            fullName,
            username,
          },
        },
      });

      if (error) {
        return response.error(res, error.message, "Failed to register user");
      }

      response.success(res, data, "User registered successfully");
    } catch (error) {
      response.error(res, error, "Failed to register user");
    }
  },

  async login(req: Request, res: Response) {
    /**
     #swagger.tags = ["Auth"]
     #swagger.requestBody = {
      required:true,
      schema: {$ref: "#/components/schemas/LoginRequest"}
     }
     */
    const { identifier, password } = req.body as unknown as TLogin;

    try {
      if (!identifier || !password) {
        return response.unauthorized(
          res,
          "Identifier and password are required"
        );
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      });

      if (error) {
        return response.unauthorized(res, error.message);
      }

      response.success(res, data, "Login successful");
    } catch (error) {
      response.error(res, error, "Failed to login");
    }
  },

  async me(req: IReqUser, res: Response) {
    /**
      #swagger.tags = ["Auth"]
      #swagger.security = [{
        "bearerAuth": []
      }]
     */
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return response.unauthorized(res, "No token provided");
      }

      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        return response.unauthorized(res, "Invalid token or user not found");
      }

      response.success(res, data.user, "User profile fetched successfully");
    } catch (error) {
      response.error(res, error, "Failed to fetch user profile");
    }
  },

  async activation(req: Request, res: Response) {
    /**
      #swagger.tags = ["Auth"]
      #swagger.requestBody = {
        required: true,
        schema: {
          $ref: "#/components/schemas/ActivationRequest"
        }
      }
    */
    try {
      const { code } = req.body as { code: string };

      const { data, error } = await supabase.auth.verifyOtp({
        email: req.body.email,
        token: code,
        type: 'signup'
      });

      response.success(
        res,
        null,
        "Note: Supabase handles email verification automatically via secure links if enabled in dashboard."
      );
    } catch (error) {
      response.error(res, error, "Failed to activate user");
    }
  },
};