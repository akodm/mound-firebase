import { NextFunction, Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";

import db from "../modules/firestore";
import { BEARER, NEAR_TOKEN_ISSUE_DAY } from "../consts";
import { TokenTypes } from "../@types/types";
import { MoundFirestore } from "../@types/firestore";
import { ERROR_CODE } from "../consts/code";
import moment from "moment";
import "moment/locale/ko";
moment.locale("ko");

const { ACCESS_KEY, REFRESH_KEY } = process.env;

const accessOptions: SignOptions = {
  algorithm: "ES256",
  expiresIn: "3d",
  subject: "Access"
};
const refreshOptions: SignOptions = {
  algorithm: "HS512",
  expiresIn: "30d",
  subject: "Refresh"
};

// Access Token 발급
export const accessIssue = (payload: TokenTypes.Payload, options: SignOptions = accessOptions): string => {
  try {
    return jwt.sign(payload, ACCESS_KEY as string, options);
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
export const refreshIssue = (payload: TokenTypes.Payload, options: SignOptions = refreshOptions): string => {
  try {
    return jwt.sign(payload, REFRESH_KEY as string, options);
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

    const object = await accessVerify(value) as TokenTypes.Payload | undefined;

    if (!object?.id) {
      throw { s: 401, m: "잘못된 인증 토큰입니다.", c: ERROR_CODE.REQUEST_LOGIN };
    }

    const user = await db
      .collection("user")
      .doc(object.id)
      .get();

    const { id } = user.data() as MoundFirestore.User;

    if (!id) {
      throw { s: 401, m: "사용자를 찾을 수 없습니다.", c: ERROR_CODE.REQUEST_LOGIN };
    }

    const token = await db
      .collection("token")
      .where("userId", "==", id)
      .get();

    const compareToken = token.docs.find((item) => {
      const { access } = item.data() as MoundFirestore.Token;

      return access === value;
    });

    if (!compareToken) {
      throw { s: 401, m: "사용자 인증에 실패했습니다.", c: ERROR_CODE.REQUEST_LOGIN };
    }

    const { accessExpire } = compareToken.data() as MoundFirestore.Token;

    if (moment().isAfter(moment(accessExpire), "milliseconds")) {
      throw { s: 403, m: "만료된 토큰입니다.", c: ERROR_CODE.REQUEST_REFRESH };
    }

    req.user = {
      id,
    };

    return next();
  } catch (err: any) {
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

    const object = await refreshVerify(value) as TokenTypes.Payload | undefined;

    if (!object?.id) {
      throw { s: 401, m: "잘못된 인증 토큰입니다.", c: ERROR_CODE.REQUEST_LOGIN };
    }

    const user = await db
      .collection("user")
      .doc(object.id)
      .get();

    const { id } = user.data() as MoundFirestore.User;

    if (!id) {
      throw { s: 401, m: "사용자를 찾을 수 없습니다.", c: ERROR_CODE.REQUEST_LOGIN };
    }

    const token = await db
      .collection("token")
      .where("userId", "==", id)
      .get();

    const compareToken = token.docs.find((item) => {
      const { refresh } = item.data() as MoundFirestore.Token;

      return refresh === value;
    });

    if (!compareToken) {
      throw { s: 401, m: "사용자 인증에 실패했습니다.", c: ERROR_CODE.REQUEST_LOGIN };
    }

    const { refreshExpire } = compareToken.data() as MoundFirestore.Token;

    if (moment().isAfter(moment(refreshExpire), "milliseconds")) {
      throw { s: 401, m: "만료된 토큰입니다.", c: ERROR_CODE.REQUEST_LOGIN };
    }

    const nearExpire = moment().add(NEAR_TOKEN_ISSUE_DAY, "days");
    const access = accessIssue({ id });
    const refresh = !nearExpire.isAfter(moment(refreshExpire), "milliseconds") 
      ? refreshIssue({ id }) 
      : undefined;

    req.user = {
      id,
      access,
      refresh,
    }

    return next();
  } catch (err: any) {
    return next(err);
  }
};
