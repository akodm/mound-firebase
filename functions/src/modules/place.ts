import axios from "axios";
import { OpenAPITypes } from "../@types/types";

const { KAKAO_GEOCODE_KEY } = process.env;

export const getGeocode = async ({ x, y }: OpenAPITypes.GeocodeCoord) => {
  try {
    const { data } = await axios.get(`https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${x}&y=${y}`,{
      headers: {
        Authorization: `KakaoAK ${KAKAO_GEOCODE_KEY}`,
        "Content-Type": 'application/json;charset=UTF-8'
      }
    });

    if (!data?.documents?.length) {
      throw { s: 403, m: "위치를 가져오지 못했습니다." };
    }

    return data.documents[1].address_name;
  } catch (err) {
    throw err;
  }
};
