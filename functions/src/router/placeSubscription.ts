import express from "express";

import db from "../modules/firestore";
import { accessAuthentication } from "../modules/token";
import { COLLECTIONS } from "../consts";
import { MoundFirestore } from "../@types/firestore";
import { EUPMYEONDONG } from "../consts/eupMyeonDong";
import { getNowMoment } from "../utils";
import { getPlace } from "../modules/place";

const router = express.Router();

// 사용자의 위치 구독 목록 조회
router.get("/", accessAuthentication, async (req, res, next) => {
  try {
    const { id } = req.user;

    const placeSubscription = await db
      .collection(COLLECTIONS.PLACE_SUBSCRIPTION)
      .where("userId", "==", id)
      .get();

    const data = placeSubscription.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as MoundFirestore.PlaceSubscription);

    return res.status(200).send({
      result: true,
      message: "사용자의 구독 지역 목록을 가져왔습니다.",
      data,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 위치 구독 변경
router.put("/", accessAuthentication, async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { placements = [] } = req.body;

    if (!placements?.length) {
      throw { s: 400, m: "장소에 대해 찾을 수 없습니다." };
    }

    const placemantList: MoundFirestore.PlaceStructor[] = placements.reduce((res: MoundFirestore.PlaceStructor[], crr: MoundFirestore.Placement) => {
      const { siDo = "", siGuGun = "", eupMyeonDong = "" } = crr;

      const placeList: MoundFirestore.PlaceStructor[] = EUPMYEONDONG.reduce((res: MoundFirestore.PlaceStructor[], crr) => {
        const place = getPlace(crr, siDo, siGuGun, eupMyeonDong);
  
        if (place) {
          res.push(place);
        }
  
        return res;
      }, []);

      return res.concat(placeList);
    }, []);

    const placeSubscription = await db
      .collection(COLLECTIONS.PLACE_SUBSCRIPTION)
      .where("userId", "==", userId)
      .get();

    const batch = db.batch();

    placeSubscription.docs.forEach((doc) => batch.delete(doc.ref));
    placemantList.forEach((place) => {
      const ref = db.collection(COLLECTIONS.PLACE_SUBSCRIPTION).doc();

      batch.set(ref, {
        ...place,
        userId,
        createdAt: getNowMoment(),
        updatedAt: getNowMoment(),
      });
    });

    await batch.commit();

    const changePlaceSubscription = await db
      .collection(COLLECTIONS.PLACE_SUBSCRIPTION)
      .where("userId", "==", userId)
      .get();

    const data = changePlaceSubscription.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as MoundFirestore.PlaceSubscription);

    return res.status(200).send({
      result: true,
      message: "위치 구독 변경에 성공했습니다.",
      data,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
