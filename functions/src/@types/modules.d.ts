import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        access?: string;
        refresh?: string;
      }
    }
  }
}