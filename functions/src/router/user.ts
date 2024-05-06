import express from "express";
import crypto from "crypto";

import db from "../modules/firestore";
import { MoundFirestore } from "../@types/firestore";
import { phoneDelete, phoneVerify } from "../modules/sms";
import { accessIssue, refreshIssue } from "../modules/token";

const { PASSWORD_HASH_ALGORITHM } = process.env;

const router = express.Router();

// 사용자 생성 (전화번호 인증되어 있어야 함)
router.post("/", async (req, res, next) => {
  try {
    const { 
      account,
      password,
      phone,
      termsToService = false
    } = req.body;

    if (
      !account?.trim() || 
      !password?.trim() ||
      !phone?.trim() || 
      !termsToService
    ) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }

    const userRecord = await phoneVerify(phone);

    if (!userRecord?.uid) {
      throw { s: 403, m: "인증되지 않은 사용자입니다." };
    }

    const hash = crypto
      .createHash(PASSWORD_HASH_ALGORITHM as string)
      .update(password)
      .digest("hex");

    const user = await db.collection("user").add({
      uid: userRecord.uid,
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

    const access = accessIssue({ id: user.id });
    const refresh = refreshIssue({ id: user.id });

    return res.status(200).send({
      result: true,
      message: "",
      data: {
        id: user.id,
        access,
        refresh,
      },
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 사용자 삭제
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id?.trim()) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }

    const user = await db
      .collection("user")
      .doc(id)
      .get();

    const { id: userId, uid, verify } = user.data() as MoundFirestore.User;

    if (!userId) {
      throw { s: 403, m: "시용자를 찾을 수 없습니다." };
    }
    if (!verify) {
      throw { s: 403, m: "인증된 사용자가 아닙니다." };
    }

    await Promise.all([
      db.collection("user").doc(id).delete(),
      phoneDelete(uid),
    ]);

    return res.status(200).send({
      result: true,
      message: "",
      data: true,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
