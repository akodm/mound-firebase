import express from "express";

import { TestKeyInclude } from "../utils/admin";
import { accessAuthentication, accessIssue, refreshAuthentication, refreshIssue } from "../modules/token";

const router = express.Router();

// 사용자 아이디 기반 토큰 생성 (로그인)
router.get("/token/:id", TestKeyInclude, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }

    const access = accessIssue({ id });
    const refresh = refreshIssue({ id });

    return res.status(200).send({
      result: true,
      message: "",
      data: {
        id,
      },
      access,
      refresh,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 액세스 토큰 검증
router.get("/token/authcentication/access", TestKeyInclude, accessAuthentication, async (req, res, next) => {
  try {
    const { id, access, refresh } = req.user;

    if (!id) {
      throw { s: 401, m: "사용자를 찾을 수 없습니다." };
    }

    return res.status(200).send({
      result: true,
      message: "",
      data: {
        id,
      },
      access,
      refresh,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 리프레시 토큰 검증
router.get("/token/authcentication/refresh", TestKeyInclude, refreshAuthentication, async (req, res, next) => {
  try {
    const { id, access, refresh } = req.user;

    if (!id) {
      throw { s: 401, m: "사용자를 찾을 수 없습니다." };
    }

    return res.status(200).send({
      result: true,
      message: "",
      data: {
        id,
      },
      access,
      refresh,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
