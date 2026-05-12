import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./env";
import { IUserToken } from "./interface";

export const generateToken = (user: IUserToken): string => {
  const token = jwt.sign(user, JWT_SECRET, {
    expiresIn: "1h",
  });
  return token;
};

export const getUserData = (token: string) => {
  try {
    const user = jwt.verify(token, JWT_SECRET) as IUserToken;
    return user;
  } catch (error) {
    return null;
  }
};