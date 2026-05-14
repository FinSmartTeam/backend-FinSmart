import { Request } from "express";

export interface IUserToken {
  id: string;
  email: string;
  role: string;
}

export interface IReqUser extends Request {
  user?: IUserToken;
}

export interface IPaginationQuery {
  page: number;
  limit: number;
  search?: string;
}