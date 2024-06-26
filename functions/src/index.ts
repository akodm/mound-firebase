import dotenv from "dotenv";
dotenv.config();
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import helmet from "helmet";
import moment from "moment";
import "moment/locale/ko";
moment.locale("ko");

import testRouter from "./router/test";
import indexRouter from "./router";
import adminRouter from "./router/admin";
import userRouter from "./router/user";
import tokenRouter from "./router/token";
import reportRouter from "./router/report";
import placeRouter from "./router/place";
import postViewRouter from "./router/postView";
import postMediaRouter from "./router/postMedia";
import postLikeRouter from "./router/postLike";
import postCommentRouter from "./router/postComment";
import postRouter from "./router/post";
import placeSubscriptionRouter from "./router/placeSubscription";
import notificationRouter from "./router/notification";
import noticeRouter from "./router/notice";

const { NODE_ENV, ADMIN_URL } = process.env;

// Express 세팅
const app = express();

NODE_ENV === "development" && app.use(morgan("dev"));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Express 내 라우팅 처리
NODE_ENV === "development" && app.use("/test", testRouter);
app.use("/", indexRouter);
app.use(`/${ADMIN_URL}`, adminRouter);
app.use("/user", userRouter);
app.use("/token", tokenRouter);
app.use("/report", reportRouter);
app.use("/place", placeRouter);
app.use("/postView", postViewRouter);
app.use("/postMedia", postMediaRouter);
app.use("/postLike", postLikeRouter);
app.use("/postComment", postCommentRouter);
app.use("/post", postRouter);
app.use("/placeSubscription", placeSubscriptionRouter);
app.use("/notification", notificationRouter);
app.use("/notice", noticeRouter);

// 잘못된 주소 접근 시
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`REQUEST URL: ${req.url}`);

  return next({ s: 404, m: "존재하지 않는 주소입니다." });
});

// API 실패 시
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.s || err.status || 500;
  const message = err.m || "문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
  const code = err.c || null;

  console.error("CATCH ERROR:", err);
  logger.error({ status, message, code });

  return res.status(status).send({
    result: false,
    message: message,
    data: null,
    code,
  });
});

export const apis = onRequest(app);
