import express from "express";

const router = express.Router();

// 핑 테스트
router.get("/ping", (req, res, next) => {
  try {
    return res.status(200).send({
      result: true,
      message: "ping",
      data: null,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
