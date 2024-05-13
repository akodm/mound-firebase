import express from "express";

import { getGeocode } from "../modules/place";
import { accessAuthentication } from "../modules/token";

const router = express.Router();

// 위도 경도를 위치 값으로 변환
router.get("/geocode", accessAuthentication, async (req, res, next) => {
  try {
    const { x, y } = req.query;

    if (!x || !y) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }

    const data = await getGeocode({ x: x as number | string, y: y as number | string });

    return res.status(200).send({
      result: true,
      message: "위치 값 반환에 성공했습니다.",
      data,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
