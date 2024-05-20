import express from "express";
import { FieldPath, FieldValue } from "firebase-admin/firestore";

import db from "../modules/firestore";
import { COLLECTIONS } from "../consts";
import { getParentCollection } from "../utils/admin";
import { accessAuthentication } from "../modules/token";
import { getNowMoment } from "../utils";

const router = express.Router();

// 조회한 게시글 목록 조회
router.get("/", accessAuthentication, async (req, res, next) => {
  try {
    const { id } = req.user;

    const postViewDocs = await db
      .collectionGroup(COLLECTIONS.POST_VIEW)
      .where("userId", "==", id)
      .get();

    const data = await getParentCollection(postViewDocs, COLLECTIONS.POST);

    return res.status(200).send({
      result: true,
      message: "조회한 게시글 목록을 불러왔습니다.",
      data,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 게시글 조회 처리 (중복 조회 불가, 중복 조회 시 별도 에러 처리 없이 수행)
router.post("/", accessAuthentication, async (req, res, next) => {
  try {
    const { id: userId, user } = req.user;
    const { id: postId } = req.body;

    if (!postId) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }

    const postDocs = await db
      .collection(COLLECTIONS.POST)
      .where(FieldPath.documentId(), "==", postId)
      .get();

    if (postDocs.empty) {
      throw { s: 403, m: "해당 게시글을 찾을 수 없습니다." };
    }

    const [post] = postDocs.docs;
    const postRef = post.ref;

    const postViewDocs = await postRef
      .collection(COLLECTIONS.POST_VIEW)
      .where("userId", "==", userId)
      .get();

    if (postViewDocs.empty) {
      await db.runTransaction(async (tx) => {
        const postViewRef = postRef.collection(COLLECTIONS.POST_VIEW).doc();

        tx.create(postViewRef, {
          post,
          user,
          postId,
          userId,
          createdAt: getNowMoment(),
          updatedAt: getNowMoment(),
        });
        tx.update(postRef, { viewCount: FieldValue.increment(1), updatedAt: getNowMoment() });
      });
    }

    return res.status(200).send({
      result: true,
      message: "게시글 조회 처리에 성공했습니다.",
      data: true,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
