import express from "express";
import crypto from "crypto";

import db from "../modules/firestore";
import { ERROR_CODE } from "../consts/code";
import { MoundFirestore } from "../@types/firestore";
import { phoneDelete, phoneVerify } from "../modules/sms";
import { accessAuthentication, accessIssue, refreshIssue } from "../modules/token";

const { PASSWORD_HASH_ALGORITHM } = process.env;

const router = express.Router();

// 사용자 로그인
router.post("/login", async (req, res, next) => {
  try {
    const { account, password, device } = req.body;

    if (!account?.trim() || !password?.trim()) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }

    const hash = crypto
      .createHash(PASSWORD_HASH_ALGORITHM as string)
      .update(password)
      .digest("hex");

    const userDocs = await db
      .collection("user")
      .where("account", "==", account)
      .where("password", "==", hash)
      .get();

    if (!userDocs?.docs?.length) {
      throw { s: 403, m: "사용자를 찾을 수 없습니다." };
    }

    const [user] = userDocs.docs;

    const { token: access, expire: accessExpire } = accessIssue({ id: user.id });
    const { token: refresh, expire: refreshExpire } = refreshIssue({ id: user.id });

    const tokenDocs = await db
      .collection("token")
      .where("userId", "==", user.id)
      .get();

    const exist = tokenDocs.docs.find((doc) => {
      const { device: tokenDevice } = doc.data() as MoundFirestore.Token;

      return tokenDevice === device;
    });

    if (exist) {
      await exist.ref.update({
        access,
        accessExpire,
        refresh,
        refreshExpire,
      });
    } else {
      await db
        .collection("token")
        .add({
          device,
          access,
          accessExpire,
          refresh,
          refreshExpire,
          userId: user.id,
        });
    }

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

// 사용자 생성 (전화번호 인증되어 있어야 함)
router.post("/", async (req, res, next) => {
  try {
    const {
      account,
      password,
      phone,
      termsToService = false,
      device,
    } = req.body;

    if (
      !account?.trim() ||
      !password?.trim() ||
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
      .collection("user")
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
      .collection("user")
      .add({
        // uid: userRecord.uid,
        account,
        password: hash,
        phone,
        vertify: true,
        termsToService,
        block: false,
        blockExpire: null,
        notice: true,
        comment: true,
        linke: true,
        marketing: false,
      });

    if (!user?.id) {
      throw { s: 500, m: "사용자를 생성하지 못했습니다." };
    }

    const { token: access, expire: accessExpire } = accessIssue({ id: user.id });
    const { token: refresh, expire: refreshExpire } = refreshIssue({ id: user.id });

    await db
      .collection("token")
      .add({
        device,
        access,
        accessExpire,
        refresh,
        refreshExpire,
        userId: user.id,
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

    if (!id?.trim()) {
      throw { s: 401, m: "필수 값이 비어있습니다.", c: ERROR_CODE.REQUEST_LOGIN };
    }

    const user = await db
      .collection("user")
      .doc(id)
      .get();

    const { uid } = user.data() as MoundFirestore.User;

    if (!user?.id) {
      throw { s: 403, m: "시용자를 찾을 수 없습니다." };
    }

    const tokenDocs = await db
      .collection("token")
      .where("userId", "==", user.id)
      .get();

    const tokenRefs = tokenDocs.docs.map((doc) => doc.ref);

    await db.runTransaction(async (tx) => {
      tx.delete(user.ref);
      tokenRefs.forEach((ref) => tx.delete(ref));

      await phoneDelete(uid);
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
