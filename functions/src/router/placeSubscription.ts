import express from "express";

import db from "../modules/firestore";
import { accessAuthentication } from "../modules/token";
import { COLLECTIONS } from "../consts";
import { MoundFirestore } from "../@types/firestore";
import { EUPMYEONDONG } from "../consts/eupMyeonDong";
import { getNowMoment } from "../utils";

const router = express.Router();

// 사용자의 위치 구독 목록 조회
router.get("/", accessAuthentication, async (req, res, next) => {
  try {
    const { id } = req.user;

    const placeSubscription = await db
      .collection(COLLECTIONS.PLACE_SUBSCRIPTION)
      .where("userId", "==", id)
      .get();

    const data = placeSubscription.docs.map((doc) => {
      return doc.data() as MoundFirestore.PlaceSubscription;
    });

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
    const { id } = req.user;
    const { siDo, siGuGun, eupMyeonDong } = req.body;

    if (!siDo && !siGuGun && !eupMyeonDong) {
      throw { s: 400, m: "장소에 대해 찾을 수 없습니다." };
    }

    const placeList: MoundFirestore.PlaceStructor[] = EUPMYEONDONG.reduce((res: MoundFirestore.PlaceStructor[], crr) => {
      const [_sido, _sigugun, _subsigugun, _eupmyeondong] = crr.address.split(" ");
      const tempSiGuGun = _eupmyeondong ? `${_sigugun} ${_subsigugun}` : _sigugun;
      const tempEupMyeonDong = _eupmyeondong ? _eupmyeondong : _subsigugun;
      const options: MoundFirestore.PlaceSearch = {};

      if (siDo) {
        options.isSiDo = siDo === _sido;
      }
      if (siGuGun) {
        options.isSiGuGun = siGuGun === tempSiGuGun;
      }
      if (eupMyeonDong) {
        options.isEupMyeonDong = eupMyeonDong === tempEupMyeonDong;
      }

      const filter = Object
        .entries(options)
        .map(([_, value]) => value)
        .reduce((res, crr) => {
          if (!crr) {
            res = false;
          }

          return res;
        }, true);

      if (filter) {
        res.push({
          location: crr.address,
          siDo: _sido,
          siGuGun: tempSiGuGun,
          eupMyeonDong: tempEupMyeonDong,
          code: crr.code,
          latitude: crr.latitude,
          longitude: crr.longitude,
        })
      }

      return res;
    }, []);

    const placeSubscription = await db
      .collection(COLLECTIONS.PLACE_SUBSCRIPTION)
      .where("userId", "==", id)
      .get();

    const ref = db.collection(COLLECTIONS.PLACE_SUBSCRIPTION).doc();
    const batch = db.batch();

    placeSubscription.docs.forEach((doc) => batch.delete(doc.ref));

    placeList.forEach((place) => {
      batch.create(ref, {
        ...place,
        createdAt: getNowMoment(),
        updatedAt: getNowMoment(),
      });
    });

    await batch.commit();

    const changePlaceSubscription = await db
      .collection(COLLECTIONS.PLACE_SUBSCRIPTION)
      .where("userId", "==", id)
      .get();

    const data = changePlaceSubscription.docs;

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
