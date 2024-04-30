import axios from "axios";
import QueryString from "qs";

import { OpenAPITypes } from "../@types/types";

const { 
  OEPN_API_URL,
  SERVICE_ID,
  SECURITY_KEY,
} = process.env;

/**
 * CODE
 * ---- 시 코드
 * 11, 21, 22, 23, 24, 25, 26, 29, 31, 32, 33, 34, 35, 36, 37, 38, 39
 */
export const locationAPI = async ({ accessToken, cd }: OpenAPITypes.LocationParams): Promise<OpenAPITypes.LocationResult> => {
  try {
    const query: OpenAPITypes.LocationParams = { 
      accessToken,
    };

    if (cd) {
      query.cd = cd;
    }

    const qs = QueryString.stringify(query);

    const { data } = await axios.get(`${OEPN_API_URL}/addr/stage.json?${qs}`);

    return data;
  } catch (err) {
    throw err;
  }
};

export const authAPI = async (): Promise<OpenAPITypes.AuthResult> => {
  try {
    const query = {
      consumer_key: SERVICE_ID,
      consumer_secret: SECURITY_KEY,
    };

    const qs = QueryString.stringify(query);

    const { data } = await axios.get(`${OEPN_API_URL}/auth/authentication.json?${qs}`);

    if (!data?.result?.accessToken) {
      throw new Error(`데이터 조회에 실패했습니다. ${JSON.stringify(data)}`);
    }

    return data.result.accessToken;
  } catch (err) {
    throw err;
  }
};
