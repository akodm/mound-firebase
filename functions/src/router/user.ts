import express from "express";
import crypto from "crypto";
import { logger } from "firebase-functions/v1";
import { FieldValue } from "firebase-admin/firestore";
import moment from "moment";

import db from "../modules/firestore";
import { expireValidation, generateRandomString, getNowMoment, parseExpireToDateAt } from "../utils";
import { sendEmail } from "../modules/nodemailer";
import { MoundFirestore } from "../@types/firestore";
import { authCodeByEmailConfig } from "../utils/auth";
import { COLLECTIONS, PASSWORD_MAX_FAIL } from "../consts";
import { ERROR_CODE } from "../consts/code";
// import { phoneVerify, phoneDelete } from "../modules/auth";
import { accessAuthentication, accessIssue, authAuthentication, refreshIssue } from "../modules/token";

const { PASSWORD_HASH_ALGORITHM } = process.env;

const router = express.Router();

// 사용자 계정 찾기 코드 요청
router.get("/account/code", async (req, res, next) => {
  try {
    const { phone, email } = req.query;

    if (typeof phone !== "string" || typeof email !== "string") {
      throw { s: 400, m: "잘못된 요청입니다." };
    }
    if (!phone?.trim() || !email?.trim()) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }

    const userDocs = await db
      .collection(COLLECTIONS.USER)
      .where("phone", "==", `+${phone}`)
      .where("email", "==", email)
      .get();

    if (userDocs.empty) {
      throw { s: 403, m: "사용자를 찾을 수 없습니다." };
    }

    const [user] = userDocs.docs;
    const code = generateRandomString(6);
    const config = authCodeByEmailConfig(email, code);

    await db
      .collection(COLLECTIONS.EMAIL_AUTH)
      .add({
        code,
        verify: false,
        expire: moment().add(3, "minute").unix(),
        log: config.html,
        userId: user.id,
        createdAt: getNowMoment(),
        updatedAt: getNowMoment(),
      });

    const info = await sendEmail({ ...config });

    if (!info.accepted.includes(email)) {
      logger.log(`이메일 인증 오류: ${JSON.stringify({ info })}`);
      throw { s: 403, m: "이메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요." };
    }

    return res.status(200).send({
      result: true,
      message: "인증 이메일을 전송하였습니다.",
      data: true,
      code: null,
    })
  } catch (err) {
    return next(err);
  }
});

// 사용자 계정 찾기 코드 인증
router.get("/account/auth", async (req, res, next) => {
  try {
    const { email, phone, code } = req.query;

    if (
      typeof phone !== "string" ||
      typeof email !== "string" ||
      typeof code !== "string"
    ) {
      throw { s: 400, m: "잘못된 요청입니다." };
    }
    if (
      !phone?.trim() ||
      !email?.trim() ||
      !code?.trim()
    ) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }

    const emailAuthDocs = await db
      .collection(COLLECTIONS.EMAIL_AUTH)
      .where("code", "==", code)
      .get();

    if (emailAuthDocs.empty) {
      throw { s: 403, m: "코드가 잘못되었습니다." };
    }

    const [emailAuth] = emailAuthDocs.docs;
    const { verify, expire, userId } = emailAuth.data() as MoundFirestore.EmailAuth;
    const date = parseExpireToDateAt(expire);

    if (verify) {
      throw { s: 403, m: "해당 인증 코드를 사용할 수 없습니다." };
    }
    if (expireValidation(date, "second")) {
      throw { s: 403, m: "만료된 인증 코드입니다." };
    }

    const userDocs = await db
      .collection(COLLECTIONS.USER)
      .where("phone", "==", `+${phone}`)
      .where("email", "==", email)
      .get();

    if (userDocs.empty) {
      throw { s: 403, m: "사용자를 찾을 수 없습니다." };
    }

    const [user] = userDocs.docs;
    const { account } = user.data() as MoundFirestore.User;

    if (user.id !== userId) {
      throw { s: 403, m: "잘못된 인증 요청입니다." };
    }

    await emailAuth.ref.update({
      verify: true,
      updatedAt: getNowMoment(),
    });

    return res.status(200).send({
      result: true,
      message: "인증에 성공하였습니다.",
      data: {
        account,
      },
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 사용자 비밀번호 재설정 코드 요청
router.get("/password/code", async (req, res, next) => {
  try {
    const { account, phone, email } = req.query;

    if (
      typeof account !== "string" ||
      typeof phone !== "string" ||
      typeof email !== "string"
    ) {
      throw { s: 400, m: "잘못된 요청입니다." };
    }
    if (
      !account?.trim() ||
      !phone?.trim() ||
      !email?.trim()
    ) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }

    const userDocs = await db
      .collection(COLLECTIONS.USER)
      .where("account", "==", account)
      .where("phone", "==", `+${phone}`)
      .where("email", "==", email)
      .get();

    if (userDocs.empty) {
      throw { s: 403, m: "사용자를 찾을 수 없습니다." };
    }

    const [user] = userDocs.docs;
    const code = generateRandomString(6);
    const config = authCodeByEmailConfig(email, code);

    await db
      .collection(COLLECTIONS.EMAIL_AUTH)
      .add({
        code,
        verify: false,
        expire: moment().add(3, "minute").unix(),
        log: config.html,
        userId: user.id,
        createdAt: getNowMoment(),
        updatedAt: getNowMoment(),
      });

    const info = await sendEmail({ ...config });

    if (!info.accepted.includes(email)) {
      logger.log(`이메일 인증 오류: ${JSON.stringify({ info })}`);
      throw { s: 403, m: "이메일 전송에 실패했습니다. 잠시 후 다시 시도해주세요." };
    }

    return res.status(200).send({
      result: true,
      message: "인증 이메일을 전송하였습니다.",
      data: true,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 사용자 비밀번호 재설정 코드 인증
router.get("/password/auth", async (req, res, next) => {
  try {
    const { account, phone, email, code, fcm } = req.query;

    if (
      typeof account !== "string" ||
      typeof phone !== "string" ||
      typeof email !== "string" ||
      typeof code !== "string"
    ) {
      throw { s: 400, m: "잘못된 요청입니다." };
    }
    if (
      !account?.trim() ||
      !phone?.trim() ||
      !email?.trim() ||
      !code?.trim()
    ) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }

    const emailAuthDocs = await db
      .collection(COLLECTIONS.EMAIL_AUTH)
      .where("code", "==", code)
      .get();

    if (emailAuthDocs.empty) {
      throw { s: 403, m: "코드가 잘못되었습니다." };
    }

    const [emailAuth] = emailAuthDocs.docs;
    const { verify, expire, userId } = emailAuth.data() as MoundFirestore.EmailAuth;
    const date = parseExpireToDateAt(expire);

    if (verify) {
      throw { s: 403, m: "해당 인증 코드를 사용할 수 없습니다." };
    }
    if (expireValidation(date, "second")) {
      throw { s: 403, m: "만료된 인증 코드입니다." };
    }

    const userDocs = await db
      .collection(COLLECTIONS.USER)
      .where("account", "==", account)
      .where("phone", "==", `+${phone}`)
      .where("email", "==", email)
      .get();

    if (userDocs.empty) {
      throw { s: 403, m: "사용자를 찾을 수 없습니다." };
    }

    const [user] = userDocs.docs;

    if (user.id !== userId) {
      throw { s: 403, m: "잘못된 인증 요청입니다." };
    }

    await emailAuth.ref.update({
      verify: true,
      updatedAt: getNowMoment(),
    });

    const userAgent = req.headers["user-agent"];
    const { token: access, expire: accessExpire } = accessIssue({ id: user.id });
    const { token: refresh, expire: refreshExpire } = refreshIssue({ id: user.id });

    const tokenDocs = await db
      .collection(COLLECTIONS.TOKEN)
      .where("userId", "==", user.id)
      .where("userAgent", "==", userAgent)
      .get();

    const [token] = tokenDocs.docs;

    await db.runTransaction(async (tx) => {
      if (token) {
        tx.update(token.ref, {
          fcm,
          access,
          accessExpire,
          refresh,
          refreshExpire,
          updatedAt: getNowMoment(),
        });
      } else {
        const tokenRef = db.collection(COLLECTIONS.TOKEN).doc();

        tx.create(tokenRef, {
          fcm,
          userAgent,
          access,
          accessExpire,
          refresh,
          refreshExpire,
          userId: user.id,
          createdAt: getNowMoment(),
          updatedAt: getNowMoment(),
        });
      }

      tx.update(user.ref, {
        failCount: 0,
        updatedAt: getNowMoment(),
      });
    });

    return res.status(200).send({
      result: true,
      message: "인증에 성공하였습니다.",
      data: true,
      access,
      refresh,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 사용자 비밀번호 재설정
router.post("/password", authAuthentication, async (req, res, next) => {
  try {
    const { id } = req.user;
    const { password } = req.body;

    if (!password?.trim()) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }

    const hash = crypto
      .createHash(PASSWORD_HASH_ALGORITHM as string)
      .update(password)
      .digest("hex");

    const userDoc = db
      .collection(COLLECTIONS.USER)
      .doc(id);

    await userDoc.update({
      password: hash,
      updatedAt: getNowMoment(),
    });

    return res.status(200).send({
      result: true,
      message: "비밀번호가 재설정 되었습니다. 다시 로그인하여 주세요.",
      data: true,
      code: ERROR_CODE.REQUEST_LOGIN,
    });
  } catch (err) {
    return next(err);
  }
});

// 사용자 로그인
router.post("/login", async (req, res, next) => {
  try {
    const { account, password, fcm } = req.body;

    if (!account?.trim() || !password?.trim()) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }

    const hash = crypto
      .createHash(PASSWORD_HASH_ALGORITHM as string)
      .update(password)
      .digest("hex");

    const userDocs = await db
      .collection(COLLECTIONS.USER)
      .where("account", "==", account)
      .get();

    if (userDocs.empty) {
      throw { s: 403, m: "사용자를 찾을 수 없습니다." };
    }

    const [user] = userDocs.docs;
    const { password: userPassword, failCount = 0 } = user.data() as MoundFirestore.User;

    if (failCount >= PASSWORD_MAX_FAIL) {
      throw { s: 403, m: `비밀번호 입력에 ${PASSWORD_MAX_FAIL}회 이상 실패하였습니다. 비밀번호를 재설정 해주세요.` };
    }
    if (userPassword !== hash) {
      await user.ref.update({
        failCount: FieldValue.increment(1),
        updatedAt: getNowMoment(),
      });
      throw { s: 403, m: "사용자를 찾을 수 없습니다." };
    }

    const userAgent = req.headers["user-agent"];
    const { token: access, expire: accessExpire } = accessIssue({ id: user.id });
    const { token: refresh, expire: refreshExpire } = refreshIssue({ id: user.id });

    const tokenDocs = await db
      .collection(COLLECTIONS.TOKEN)
      .where("userId", "==", user.id)
      .where("userAgent", "==", userAgent)
      .get();

    const [token] = tokenDocs.docs;

    await db.runTransaction(async (tx) => {
      if (token) {
        tx.update(token.ref, {
          fcm,
          access,
          accessExpire,
          refresh,
          refreshExpire,
          updatedAt: getNowMoment(),
        });
      } else {
        const tokenRef = db.collection(COLLECTIONS.TOKEN).doc();

        tx.create(tokenRef, {
          fcm,
          userAgent,
          access,
          accessExpire,
          refresh,
          refreshExpire,
          userId: user.id,
          createdAt: getNowMoment(),
          updatedAt: getNowMoment(),
        });
      }

      tx.update(user.ref, {
        failCount: 0,
        updatedAt: getNowMoment(),
      });
    });

    return res.status(200).send({
      result: true,
      data: {
        id: user.id,
      },
      access,
      refresh,
      message: "로그인에 성공하였습니다.",
      code: null,
    })
  } catch (err) {
    return next(err);
  }
});

// 시용자 로그아웃
router.post("/logout", accessAuthentication, async (req, res, next) => {
  try {
    const { id } = req.user;
    const userAgent = req.headers["user-agent"];

    const tokenDocs = await db
      .collection(COLLECTIONS.TOKEN)
      .where("userId", "==", id)
      .where("userAgent", "==", userAgent)
      .get();

    const [token] = tokenDocs.docs;

    if (token) {
      await token.ref.delete();
    }

    return res.status(200).send({
      result: true,
      message: "로그아웃 처리되었습니다.",
      data: true,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 사용자 생성 (전화번호 인증되어 있어야 함)
router.post("/", async (req, res, next) => {
  try {
    const {
      account,
      nickname = "",
      password,
      email,
      fcm,
      phone,
      termsToService = false,
    } = req.body;

    if (
      !account?.trim() ||
      !password?.trim() ||
      !email?.trim() ||
      !fcm?.trim() ||
      !phone?.trim() ||
      !termsToService
    ) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }

    // const userRecord = await phoneVerify(phone);

    // if (!userRecord?.uid) {
    //   throw { s: 403, m: "인증되지 않은 사용자입니다.", c: ERROR_CODE.REQUEST_PHONE_AUTH };
    // }

    const exist = await db
      .collection(COLLECTIONS.USER)
      .where("account", "==", account)
      .get();

    if (!exist.empty) {
      throw { s: 403, m: "이미 존재하는 아이디입니다." };
    }

    const hash = crypto
      .createHash(PASSWORD_HASH_ALGORITHM as string)
      .update(password)
      .digest("hex");

    const user = await db
      .collection(COLLECTIONS.USER)
      .add({
        // uid: userRecord.uid,
        account,
        nickname,
        password: hash,
        email,
        phone,
        verify: true,
        termsToService,
        reportCount: 0,
        failCount: 0,
        block: false,
        blockExpire: null,
        notice: true,
        comment: true,
        link: true,
        marketing: false,
        createdAt: getNowMoment(),
        updatedAt: getNowMoment(),
      });

    if (!user?.id) {
      throw { s: 500, m: "사용자를 생성하지 못했습니다." };
    }

    const { token: access, expire: accessExpire } = accessIssue({ id: user.id });
    const { token: refresh, expire: refreshExpire } = refreshIssue({ id: user.id });
    const userAgent = req.headers["user-agent"];

    await db
      .collection(COLLECTIONS.TOKEN)
      .add({
        fcm,
        userAgent,
        access,
        accessExpire,
        refresh,
        refreshExpire,
        userId: user.id,
        createdAt: getNowMoment(),
        updatedAt: getNowMoment(),
      });

    return res.status(200).send({
      result: true,
      message: "회원가입에 성공했습니다.",
      data: {
        id: user.id,
      },
      access,
      refresh,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 사용자 삭제
router.delete("/", accessAuthentication, async (req, res, next) => {
  try {
    const { id } = req.user;

    const user = await db
      .collection(COLLECTIONS.USER)
      .doc(id)
      .get();

    // const { uid } = user.data() as MoundFirestore.User;

    if (!user?.id) {
      throw { s: 403, m: "시용자를 찾을 수 없습니다." };
    }

    const tokenDocs = await db
      .collection(COLLECTIONS.TOKEN)
      .where("userId", "==", user.id)
      .get();

    await db.runTransaction(async (tx) => {
      tx.delete(user.ref);
      tokenDocs.docs.forEach((doc) => tx.delete(doc.ref));

      // await phoneDelete(uid);
    });

    return res.status(200).send({
      result: true,
      message: "회원 탈퇴되었습니다.",
      data: true,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
