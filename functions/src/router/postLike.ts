import express from "express";
import { FieldPath, FieldValue } from "firebase-admin/firestore";

import db from "../modules/firestore";
import { COLLECTIONS } from "../consts";
import { getNowMoment } from "../utils";
import { accessAuthentication } from "../modules/token";
import { getParentCollection } from "../utils/admin";

const router = express.Router();

// 좋아요한 게시글 목록 조회
router.get("/", accessAuthentication, async (req, res, next) => {
  try {
    const { id } = req.user;

    const postLikeDocs = await db
      .collectionGroup(COLLECTIONS.POST_LIKE)
      .where("userId", "==", id)
      .get();

    const data = await getParentCollection(postLikeDocs, COLLECTIONS.POST);

    return res.status(200).send({
      result: true,
      message: "좋아요한 게시글 목록을 불러왔습니다.",
      data,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 게시글 좋아요 처리
router.put("/", accessAuthentication, async (req, res, next) => {
  try {
    const { id: userId } = req.user;
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

    const postLikeDocs = await postRef
      .collection(COLLECTIONS.POST_LIKE)
      .where("userId", "==", userId)
      .get();

    await db.runTransaction(async (tx) => {
      if (postLikeDocs.empty) {
        const postLikeRef = postRef.collection(COLLECTIONS.POST_LIKE).doc();

        tx.create(postLikeRef, {
          postId,
          userId,
          createdAt: getNowMoment(),
          updatedAt: getNowMoment(),
        });
        tx.update(postRef, { likeCount: FieldValue.increment(1), updatedAt: getNowMoment() });
      } else {
        const postLikeRef = postLikeDocs.docs[0].ref;

        tx.delete(postLikeRef);
        tx.update(postRef, { likeCount: FieldValue.increment(-1), updatedAt: getNowMoment() });
      }
    });

    return res.status(200).send({
      result: true,
      message: "좋아요 수정에 성공했습니다.",
      data: true,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
