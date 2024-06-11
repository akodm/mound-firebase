import express from "express";
import { testKeyInclude } from "../utils/admin";

const router = express.Router();

// 환경변수 확인
router.get("/env", testKeyInclude, (req, res, next) => {
  try {
    return res.status(200).send({
      result: true,
      message: "",
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
