import express from "express";

import { refreshAuthentication } from "../modules/token";
import { ERROR_CODE } from "../consts/code";

const router = express.Router();

// 재로그인 또는 액세스 토큰 갱신
router.get("/authentication/refresh", refreshAuthentication, (req, res, next) => {
  try {
    const { id, access, refresh } = req.user;

    if (!id) {
      throw { s: 401, m: "사용자를 찾을 수 없습니다.", code: ERROR_CODE.REQUEST_LOGIN }; 
    }

    return res.status(200).send({
      result: true,
      message: "",
      data: {
        id,
        access,
        refresh,
      },
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
