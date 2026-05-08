import { Request } from "express";
import { User } from "@supabase/supabase-js";

export interface IReqUser extends Request {
  user?: User;
}

export interface IPaginationQuery {
  page: number;
  limit: number;
  search?: string;
}