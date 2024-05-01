import dotenv from "dotenv";
dotenv.config();
import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import * as logger from "firebase-functions/logger";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import helmet from "helmet";
import moment from "moment";
import "moment/locale/ko";
moment.locale("ko");

import indexRouter from "./router";

const {
  NODE_ENV,
} = process.env;

const app = express();

NODE_ENV === "development" && app.use(morgan("dev"));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

initializeApp();

app.use("/", indexRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`REQUEST URL: ${req.url}`, { structuredData: true });
  next({ s: 404, m: "존재하지 않는 주소입니다." });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.s || err.status || 500;
  const message = err.m || "문제가 발생했습니다. 잠시 후 다시 시도해주세요.";

  console.error("CATCH ERROR:", err);
  logger.info(`CATCH ERROR: ${JSON.stringify(err, null, 2)}`, { structuredData: true });

  return res.status(status).send({
    result: false,
    message: message,
    data: null,
  });
});

export const apis = onRequest(app);
