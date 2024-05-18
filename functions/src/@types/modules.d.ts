import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        user: FirebaseFirestore.DocumentData;
        access?: string;
        refresh?: string;
      }
    }
  }
}