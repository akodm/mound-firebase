import express from "express";

import { refreshAuthentication } from "../modules/token";

const router = express.Router();

// 재로그인 또는 액세스 토큰 갱신
router.get("/authentication/refresh", refreshAuthentication, (req, res, next) => {
  try {
    const { id, access, refresh } = req.user;

    return res.status(200).send({
      result: true,
      data: {
        id,
      },
      message: "로그인에 성공하였습니다.",
      access,
      refresh,
      code: null,
    })
  } catch (err) {
    return next(err);
  }
});

export default router;
