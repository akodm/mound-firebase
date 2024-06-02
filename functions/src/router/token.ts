import express from "express";
import { FieldPath } from "firebase-admin/firestore";

import db from "../modules/firestore";
import { COLLECTIONS } from "../consts";
import { getNowMoment } from "../utils";
import { refreshAuthentication } from "../modules/token";

const router = express.Router();

// 재로그인 또는 액세스 토큰 갱신
router.get("/authentication/refresh", refreshAuthentication, async (req, res, next) => {
  try {
    const { id, access, refresh } = req.user;

    const userDocs = await db
      .collection(COLLECTIONS.USER)
      .where(FieldPath.documentId(), "==", id)
      .get();

    if (userDocs.empty) {
      throw { s: 403, m: "사용자를 찾읗 수 없습니다." };
    }

    const [user] = userDocs.docs;

    await user.ref.update({
      failCount: 0,
      updatedAt: getNowMoment(),
    });

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
