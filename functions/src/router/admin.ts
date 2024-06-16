import express from "express";
import { adminAuthentication } from "../utils/admin";

const router = express.Router();

// 환경변수 확인
router.get("/env", adminAuthentication, (req, res, next) => {
  try {
    return res.status(200).send({
      result: true,
      message: "환경변수를 확인합니다.",
      data: {
        env: process.env.NODE_ENV,
      },
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
