import express from "express";

import db from "../modules/firestore";
import { accessAuthentication } from "../modules/token";
import { COLLECTIONS, REPORT_TYPES } from "../consts";
import { FieldPath } from "firebase-admin/firestore";

const router = express.Router();

// 신고한 게시글 목록 조회
router.get("/user", accessAuthentication, async (req, res, next) => {
  try {
    const { id } = req.user;

    const userReportDocs = await db
      .collectionGroup(COLLECTIONS.USER_REPORT)
      .where("userId", "==", id)
      .get();

    const data = userReportDocs.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

    return res.status(200).send({
      result: true,
      message: "",
      data,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 신고한 게시글 목록 조회
router.get("/post", accessAuthentication, async (req, res, next) => {
  try {
    const { id } = req.user;

    const userReportDocs = await db
      .collectionGroup(COLLECTIONS.USER_REPORT)
      .where("userId", "==", id)
      .get();

    const data = userReportDocs.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

    return res.status(200).send({
      result: true,
      message: "",
      data,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 신고한 댓글 목록 조회
router.get("/comment", accessAuthentication, async (req, res, next) => {
  try {
    const { id } = req.user;

    const userReportDocs = await db
      .collectionGroup(COLLECTIONS.USER_REPORT)
      .where("userId", "==", id)
      .get();

    const data = userReportDocs.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

    return res.status(200).send({
      result: true,
      message: "",
      data,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 사용자 신고 (신고 당시 사용자 데이터 저장)
router.post("/user", accessAuthentication, async (req, res, next) => {
  try {
    const { id } = req.user;
    const {
      text,
      reportType,
      targetId,
    } = req.body;

    if (!text?.trim()) {
      throw { s: 400, m: "내용이 없습니다." };
    }
    if (!REPORT_TYPES.includes(reportType)) {
      throw { s: 400, m: "잘못된 신고 타입입니다." };
    }
    if (!targetId) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }
    // if (id === targetId) {
    //   throw { s: 403, m: "본인을 신고할 수 없습니다." };
    // }

    const userRef = db
      .collection(COLLECTIONS.USER)
      .doc(id);

    const targetDocs = await db
      .collection(COLLECTIONS.USER)
      .where(FieldPath.documentId(), "==", targetId)
      .get();

    if (targetDocs.empty) {
      throw { s: 403, m: "신고할 대상을 찾을 수 없습니다." };
    }

    const [target] = targetDocs.docs;

    const userReportAdd = await userRef
      .collection(COLLECTIONS.USER_REPORT)
      .add({
        text,
        reportType,
        targetId,
        userId: id,
        target: { ...target.data() },
      });

    const userReportDoc = await userReportAdd.get();

    return res.status(200).send({
      result: true,
      message: "",
      data: {
        ...userReportDoc.data(),
        id: userReportDoc.id,
      },
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 게시글 신고 (신고 당시 게시글 저장)
router.post("/post", accessAuthentication, async (req, res, next) => {
  try {
    const { id } = req.user;
    const {
      text,
      reportType,
      targetId,
    } = req.body;

    if (!text?.trim()) {
      throw { s: 400, m: "내용이 없습니다." };
    }
    if (!REPORT_TYPES.includes(reportType)) {
      throw { s: 400, m: "잘못된 신고 타입입니다." };
    }
    if (!targetId) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }

    const userRef = db
      .collection(COLLECTIONS.USER)
      .doc(id);

    const targetDocs = await db
      .collection(COLLECTIONS.POST)
      .where(FieldPath.documentId(), "==", targetId)
      .get();

    if (targetDocs.empty) {
      throw { s: 403, m: "신고할 게시글을 찾을 수 없습니다." };
    }

    const [target] = targetDocs.docs;

    const postReportAdd = await userRef
      .collection(COLLECTIONS.POST_REPORT)
      .add({
        text,
        reportType,
        targetId,
        userId: id,
        target: { ...target.data() },
      });

    const postReportDoc = await postReportAdd.get();

    return res.status(200).send({
      result: true,
      message: "",
      data: {
        ...postReportDoc.data(),
        id: postReportDoc.id,
      },
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 댓글 신고 (신고 당시 게시글과 댓글 저장)
router.post("/comment", accessAuthentication, async (req, res, next) => {
  try {
    const { id } = req.user;
    const {
      text,
      reportType,
      targetId,
      postId,
    } = req.body;
    
    if (!text?.trim()) {
      throw { s: 400, m: "내용이 없습니다." };
    }
    if (!REPORT_TYPES.includes(reportType)) {
      throw { s: 400, m: "잘못된 신고 타입입니다." };
    }
    if (!targetId || !postId) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }

    const userRef = db
      .collection(COLLECTIONS.USER)
      .doc(id);

    const postDocs = await db
      .collection(COLLECTIONS.POST)
      .where(FieldPath.documentId(), "==", postId)
      .get();

    if (postDocs.empty) {
      throw { s: 403, m: "신고할 게시글을 찾을 수 없습니다." };
    }

    const [post] = postDocs.docs;

    const targetDocs = await post.ref
      .collection(COLLECTIONS.POST_COMMENT)
      .where(FieldPath.documentId(), "==", targetId)
      .get();
    
    if (targetDocs.empty) {
      throw { s: 403, m: "신고할 게시글을 찾을 수 없습니다." };
    }

    const [target] = targetDocs.docs;

    const commentReportAdd = await userRef
      .collection(COLLECTIONS.POST_COMMENT_REPORT)
      .add({
        text,
        reportType,
        targetId,
        postId: post.id,
        userId: id,
        post: { ...post.data() },
        target: { ...target.data() },
      });

    const commentReportDoc = await commentReportAdd.get();

    return res.status(200).send({
      result: true,
      message: "",
      data: {
        ...commentReportDoc.data(),
        id: commentReportDoc.id,
      },
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
