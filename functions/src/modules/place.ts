import axios from "axios";
import { OpenAPITypes } from "../@types/types";
import { MoundFirestore } from "../@types/firestore";

const { KAKAO_GEOCODE_KEY } = process.env;

// 위도 경도를 위치로 변환
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

// 시도, 시구군, 읍면동 토대로 장소 데이터 찾기
export const getPlace = (item: OpenAPITypes.LocationParse, ...args: string[]): MoundFirestore.PlaceStructor | null => {
  const [siDo, siGuGun, eupMyeonDong] = args;
  const [_sido, _sigugun, _subsigugun, _eupmyeondong] = item.location.split(" ");
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

  const entries: [string, boolean][] = Object.entries(options);

  if (!entries.length) {
    return null;
  }

  const filter = entries
    .map(([_, value]) => value)
    .reduce((res: boolean, crr) => {
      if (!crr) {
        res = false;
      }

      return res;
    }, true);

  if (filter) {
    return {
      location: item.location,
      siDo: _sido,
      siGuGun: tempSiGuGun,
      eupMyeonDong: tempEupMyeonDong,
      code: item.code,
      latitude: item.latitude,
      longitude: item.longitude,
    };
  }

  return null;
};
