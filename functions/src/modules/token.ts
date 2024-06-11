import { NextFunction, Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import moment from "moment";
import "moment/locale/ko";
moment.locale("ko");

import db from "../modules/firestore";
import { BEARER, COLLECTIONS, NEAR_TOKEN_ISSUE_DAY } from "../consts";
import { TokenTypes } from "../@types/types";
import { MoundFirestore } from "../@types/firestore";
import { ERROR_CODE, TOKEN_ERROR_CODE } from "../consts/code";
import { expireValidation } from "../utils";

const { 
  ACCESS_KEY, 
  ACCESS_ALGORITHM, 
  REFRESH_KEY, 
  REFRESH_ALGORITHM,
  AUTH_KEY,
  AUTH_ALGORITHM,
} = process.env;

const accessOptions: SignOptions = {
  algorithm: ACCESS_ALGORITHM as jwt.Algorithm,
  expiresIn: "3d",
  subject: "Access"
};
const refreshOptions: SignOptions = {
  algorithm: REFRESH_ALGORITHM as jwt.Algorithm,
  expiresIn: "30d",
  subject: "Refresh"
};
const authOptions: SignOptions = {
  algorithm: AUTH_ALGORITHM as jwt.Algorithm,
  expiresIn: "3m",
  subject: "Auth",
};

// Access Token 발급
export const accessIssue = (payload: TokenTypes.Payload, options: SignOptions = accessOptions): TokenTypes.Issue => {
  try {
    const token = jwt.sign(payload, ACCESS_KEY as string, options);
    const expire = moment().add(3, "days").format("YYYY-MM-DD HH:mm:ss");

    return { token, expire };
  } catch (err) {
    throw err;
  }
};

// Access Token 검증
export const accessVerify = async (string: string, options: jwt.VerifyOptions = {}): Promise<Object | undefined> => {
  try {
    return new Promise((resolve, reject) => {
      jwt.verify(string, ACCESS_KEY as string, options, (err, decode) => {
        if (err) {
          return reject(err);
        }

        return resolve(decode?.valueOf());
      });
    });
  } catch (err) {
    throw err;
  }
};

// Refresh Token 발급
export const refreshIssue = (payload: TokenTypes.Payload, options: SignOptions = refreshOptions): TokenTypes.Issue => {
  try {
    const token = jwt.sign(payload, REFRESH_KEY as string, options);
    const expire = moment().add(30, "days").format("YYYY-MM-DD HH:mm:ss");

    return { token, expire };
  } catch (err) {
    throw err;
  }
};

// Refresh Token 검증
export const refreshVerify = async (string: string, options: jwt.VerifyOptions = {}): Promise<Object | undefined> => {
  try {
    return new Promise((resolve, reject) => {
      jwt.verify(string, REFRESH_KEY as string, options, (err, decode) => {
        if (err) {
          return reject(err);
        }

        return resolve(decode?.valueOf());
      });
    });
  } catch (err) {
    throw err;
  }
};

// Auth Token 발급
export const authIssue = (payload: TokenTypes.Payload, options: SignOptions = authOptions): TokenTypes.Issue => {
  try {
    const token = jwt.sign(payload, AUTH_KEY as string, options);
    const expire = moment().add(3, "minute").format("YYYY-MM-DD HH:mm:ss");

    return { token, expire };
  } catch (err) {
    throw err;
  }
};

// Auth Token 검증
export const authVerify = async (string: string, options: jwt.VerifyOptions = {}): Promise<Object | undefined> => {
  try {
    return new Promise((resolve, reject) => {
      jwt.verify(string, AUTH_KEY as string, options, (err, decode) => {
        if (err) {
          return reject(err);
        }

        return resolve(decode?.valueOf());
      });
    });
  } catch (err) {
    throw err;
  }
};

// Access Token 인증
export const accessAuthentication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = req.headers?.authorization;

    if (!auth?.trim()) {
      throw { s: 401, m: "사용자를 확인할 수 없습니다.", c: ERROR_CODE.REQUEST_LOGIN };
    }

    const [bearer, value] = auth.split(" ");

    if (bearer !== BEARER || !value?.trim()) {
      throw { s: 401, m: "인증 요청이 잘못되었습니다.", c: ERROR_CODE.REQUEST_LOGIN };
    }

    const object = await accessVerify(value) as TokenTypes.JwtObject | undefined;

    if (!object?.id || object.sub !== "Access") {
      throw { s: 401, m: "잘못된 인증 토큰입니다.", c: ERROR_CODE.REQUEST_LOGIN };
    }

    const user = await db
      .collection(COLLECTIONS.USER)
      .doc(object.id)
      .get();
    const data = user.data();

    if (!user?.id || !data) {
      throw { s: 401, m: "사용자를 찾을 수 없습니다.", c: ERROR_CODE.REQUEST_LOGIN };
    }

    const token = await db
      .collection(COLLECTIONS.TOKEN)
      .where("userId", "==", user.id)
      .get();

    const compareToken = token.docs.find((item) => {
      const { access } = item.data() as MoundFirestore.Token;

      return access === value;
    });

    if (!compareToken) {
      throw { s: 401, m: "사용자 인증에 실패했습니다.", c: ERROR_CODE.REQUEST_LOGIN };
    }

    const { accessExpire } = compareToken.data() as MoundFirestore.Token;

    if (expireValidation(accessExpire)) {
      throw { s: 403, m: "만료된 토큰입니다.", c: ERROR_CODE.REQUEST_REFRESH };
    }

    req.user = {
      id: user.id,
    };

    return next();
  } catch (err: any) {
    if (err.name === TOKEN_ERROR_CODE.JSON_WEB_TOKEN) {
      return next({ s: 401, m: "잘못된 토큰입니다.", c: ERROR_CODE.REQUEST_LOGIN });
    }
    if (err.name === TOKEN_ERROR_CODE.TOKEN_EXPIRED) {
      return next({ s: 403, m: "만료된 토큰입니다.", c: ERROR_CODE.REQUEST_REFRESH });
    }

    return next(err);
  }
};

// Refresh Token 인증
export const refreshAuthentication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = req.headers?.authorization;

    if (!auth?.trim()) {
      throw { s: 401, m: "사용자를 확인할 수 없습니다.", c: ERROR_CODE.REQUEST_LOGIN };
    }

    const [bearer, value] = auth.split(" ");

    if (bearer !== BEARER || !value?.trim()) {
      throw { s: 401, m: "인증 요청이 잘못되었습니다.", c: ERROR_CODE.REQUEST_LOGIN };
    }

    const object = await refreshVerify(value) as TokenTypes.JwtObject | undefined;

    if (!object?.id || object.sub !== "Refresh") {
      throw { s: 401, m: "잘못된 인증 토큰입니다.", c: ERROR_CODE.REQUEST_LOGIN };
    }

    const user = await db
      .collection(COLLECTIONS.USER)
      .doc(object.id)
      .get();
    const data = user.data();

    if (!user?.id || !data) {
      throw { s: 401, m: "사용자를 찾을 수 없습니다.", c: ERROR_CODE.REQUEST_LOGIN };
    }

    const token = await db
      .collection(COLLECTIONS.TOKEN)
      .where("userId", "==", user.id)
      .get();

    const compareToken = token.docs.find((item) => {
      const { refresh } = item.data() as MoundFirestore.Token;

      return refresh === value;
    });

    if (!compareToken) {
      throw { s: 401, m: "사용자 인증에 실패했습니다.", c: ERROR_CODE.REQUEST_LOGIN };
    }

    const { refreshExpire } = compareToken.data() as MoundFirestore.Token;

    if (expireValidation(refreshExpire)) {
      throw { s: 401, m: "만료된 토큰입니다.", c: ERROR_CODE.REQUEST_LOGIN };
    }

    const { token: access, expire: accessExpire } = accessIssue({ id: user.id });
    const result = expireValidation(refreshExpire, "minutes", NEAR_TOKEN_ISSUE_DAY, "days")
      ? refreshIssue({ id: user.id })
      : undefined;

    const updateTokens: MoundFirestore.DataJson = {
      access,
      accessExpire,
      updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
    };

    if (result?.token) {
      updateTokens.refresh = result.token;
      updateTokens.refreshExpire = result.expire;
    }

    await compareToken.ref.update(updateTokens);

    req.user = {
      id: user.id,
      access,
      refresh: result?.token,
    }

    return next();
  } catch (err: any) {
    if (err.name === TOKEN_ERROR_CODE.JSON_WEB_TOKEN) {
      return next({ s: 401, m: "잘못된 토큰입니다.", c: ERROR_CODE.REQUEST_LOGIN });
    }
    if (err.name === TOKEN_ERROR_CODE.TOKEN_EXPIRED) {
      return next({ s: 401, m: "만료된 토큰입니다.", c: ERROR_CODE.REQUEST_LOGIN });
    }

    return next(err);
  }
};

// Access Token 인증
export const authAuthentication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = req.headers?.authorization;

    if (!auth?.trim()) {
      throw { s: 403, m: "요청이 잘못되었습니다." };
    }

    const [bearer, value] = auth.split(" ");

    if (bearer !== BEARER || !value?.trim()) {
      throw { s: 403, m: "인증 요청이 잘못되었습니다." };
    }

    const object = await accessVerify(value) as TokenTypes.JwtObject | undefined;

    if (!object?.id || object.sub !== "Auth") {
      throw { s: 403, m: "잘못된 인증 토큰입니다." };
    }

    const user = await db
      .collection(COLLECTIONS.USER)
      .doc(object.id)
      .get();
    const data = user.data();

    if (!user?.id || !data) {
      throw { s: 403, m: "사용자를 찾을 수 없습니다. 다시 인증하여 주세요.", c: ERROR_CODE.REQUEST_RE_AUTH };
    }

    const token = await db
      .collection(COLLECTIONS.TOKEN)
      .where("userId", "==", user.id)
      .get();

    const compareToken = token.docs.find((item) => {
      const { access } = item.data() as MoundFirestore.Token;

      return access === value;
    });

    if (!compareToken) {
      throw { s: 403, m: "사용자 인증에 실패했습니다. 다시 인증하여 주세요.", c: ERROR_CODE.REQUEST_RE_AUTH };
    }

    const { accessExpire } = compareToken.data() as MoundFirestore.Token;

    if (expireValidation(accessExpire)) {
      throw { s: 403, m: "만료된 토큰입니다.", c: ERROR_CODE.REQUEST_RE_AUTH };
    }

    req.user = {
      id: user.id,
    };

    return next();
  } catch (err: any) {
    if (err.name === TOKEN_ERROR_CODE.JSON_WEB_TOKEN) {
      return next({ s: 401, m: "잘못된 토큰입니다.", c: ERROR_CODE.REQUEST_RE_AUTH });
    }
    if (err.name === TOKEN_ERROR_CODE.TOKEN_EXPIRED) {
      return next({ s: 403, m: "만료된 토큰입니다.", c: ERROR_CODE.REQUEST_RE_AUTH });
    }

    return next(err);
  }
};
