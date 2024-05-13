import express from "express";

import db from "../modules/firestore";
import { accessAuthentication } from "../modules/token";
import { COLLECTIONS } from "../consts";

const router = express.Router();

router.get("/", accessAuthentication, async (req, res, next) => {
  try {
    const { id } = req.user;

    const placeSubscription = await db
      .collection(COLLECTIONS.PLACE_SUBSCRIPTION)
      .where("userId", "==", id)
      .get();

    const data = placeSubscription.docs

    return res.status(200).send({
      result: true,
      message: "사용자의 구독 지역 목록을 가져왔습니다.",
      data,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
