import express from "express";
import { FieldPath, FieldValue } from "firebase-admin/firestore";

import db from "../modules/firestore";
import { COLLECTIONS } from "../consts";
import { getParentCollection } from "../utils/admin";
import { accessAuthentication } from "../modules/token";
import { getNowMoment } from "../utils";

const router = express.Router();

// 댓글 단 게시글 목록 조회
router.get("/", accessAuthentication, async (req, res, next) => {
  try {
    const { id } = req.user;

    const postLikeDocs = await db
      .collectionGroup(COLLECTIONS.POST_COMMENT)
      .where("userId", "==", id)
      .get();

    const data = await getParentCollection(postLikeDocs, COLLECTIONS.POST);

    return res.status(200).send({
      result: true,
      message: "댓글 기록이 있는 게시글 목록을 불러왔습니다.",
      data,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 댓글 생성
router.post("/", accessAuthentication, async (req, res, next) => {
  try {
    const { id: userId, user } = req.user;
    const {
      text,
      postId,
      postCommentId,
    } = req.body;

    if (!postId) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }
    if (!text?.trim()) {
      throw { s: 400, m: "내용이 없습니다." };
    }

    const postDocs = await db
      .collection(COLLECTIONS.POST)
      .where(FieldPath.documentId(), "==", postId)
      .get();

    if (postDocs.empty) {
      throw { s: 403, m: "해당 게시글을 찾을 수 없습니다." };
    }

    const [post] = postDocs.docs;
    let postComment = null;

    if (postCommentId) {
      const postCommentDocs = await post.ref
        .collection(COLLECTIONS.POST_COMMENT)
        .where(FieldPath.documentId(), "==", postCommentId)
        .get();

      const [tempComment = null] = postCommentDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      postComment = tempComment;
    }

    const options: FirebaseFirestore.DocumentData = {
      text,
      reportCount: 0,
      block: false,
      postId,
      userId,
      post: { ...post.data() },
      user,
      createdAt: getNowMoment(),
      updatedAt: getNowMoment(),
    };

    if (postCommentId && postComment?.id) {
      options.postComment = { ...postComment };
      options.postCommentId = postCommentId;
    }

    const postCommentAdd = await post.ref
      .collection(COLLECTIONS.POST_COMMENT)
      .add(options);
    await post.ref.update({ commentCount: FieldValue.increment(1), updatedAt: getNowMoment() });

    const postCommentDoc = await postCommentAdd.get();

    return res.status(200).send({
      result: true,
      message: "댓글 생성에 성공했습니다.",
      data: {
        ...postCommentDoc.data(),
        id: postCommentDoc.id,
      },
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 댓글 수정
router.put("/", accessAuthentication, async (req, res, next) => {
  try {
    const { id } = req.user;
    const {
      text,
      postCommentId,
    } = req.body;

    if (!postCommentId) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }
    if (!text?.trim()) {
      throw { s: 400, m: "내용이 없습니다." };
    }

    const postCommentDocs = await db
      .collectionGroup(COLLECTIONS.POST_COMMENT)
      .where(FieldPath.documentId(), "==", postCommentId)
      .where("userId", "==", id)
      .get();

    if (postCommentDocs.empty) {
      throw { s: 403, m: "댓글을 찾을 수 없습니다." };
    }

    const [postComment] = postCommentDocs.docs;

    await postComment.ref.update({ text, updatedAt: getNowMoment() });

    return res.status(200).send({
      result: true,
      message: "댓글 수정에 성공했습니다.",
      data: true,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 댓글 삭제
router.delete("/:id", accessAuthentication, async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const { id: postCommentId } = req.params;

    if (!postCommentId) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }

    const postCommentDocs = await db
      .collectionGroup(COLLECTIONS.POST_COMMENT)
      .where(FieldPath.documentId(), "==", postCommentId)
      .where("userId", "==", userId)
      .get();

    if (postCommentDocs.empty) {
      throw { s: 403, m: "댓글을 찾을 수 없습니다." };
    }

    const [postComment] = postCommentDocs.docs;

    await postComment.ref.delete();

    return res.status(200).send({
      result: true,
      message: "댓글을 삭제하는데 성공했습니다.",
      data: true,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
