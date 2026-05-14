import { NextFunction, Request, Response } from "express";
import { getUserData } from "../utils/jwt";
import { IReqUser } from "../utils/interface";
import response from "../utils/response";

export default (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.headers?.authorization;

  if (!authorization) {
    return response.unauthorized(res);
  }

  const [prefix, accessToken] = authorization.split(" ");
  if (!(prefix === "Bearer" && accessToken)) {
    return response.unauthorized(res);
  }

  const user = getUserData(accessToken);

  if (!user) {
    return response.unauthorized(res);
  }

  (req as IReqUser).user = user;

  next();
};