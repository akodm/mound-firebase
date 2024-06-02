import express from "express";
import crypto from "crypto";

import db from "../modules/firestore";
// import { MoundFirestore } from "../@types/firestore";
// import { phoneDelete } from "../modules/sms";
import { accessAuthentication, accessIssue, refreshIssue } from "../modules/token";
import { getNowMoment } from "../utils";
import { COLLECTIONS, PASSWORD_MAX_FAIL } from "../consts";
import { ERROR_CODE } from "../consts/code";
import { phoneVerify } from "../modules/sms";
import { MoundFirestore } from "../@types/firestore";
import { FieldValue } from "firebase-admin/firestore";

const { PASSWORD_HASH_ALGORITHM } = process.env;

const router = express.Router();

// 사용자 인증 번호 요청
router.get("/phone", async (req, res, next) => {
  try {
    const { phone } = req.query;

    if (!phone || typeof phone !== "string" || !phone.trim()) {
      throw { s: 400, m: "전화번호가 없거나 잘못되었습니다." };
    }

    const userRecord = await phoneVerify(phone);

    if (!userRecord?.uid) {
      throw { s: 401, m: "사용자를 찾을 수 없습니다.", c: ERROR_CODE.REQUEST_LOGIN };
    }

    /**
     * TODO: 
     * 1. DB 에 전화번호와 인증 보낸 번호 저장하기
     * 2. 전화번호로 인증 번호 보내기
     * 3. 해당 전화번호가 같은 디비 내 인증 번호로 인증했는지 여부 확인
     */

    return res.status(200).send({
      result: true,
      message: "인증번호를 요청하였습니다.",
      data: true,
      code: null,
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
      fcm,
      phone,
      termsToService = false,
    } = req.body;

    if (
      !account?.trim() ||
      !password?.trim() ||
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
