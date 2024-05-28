import express from "express";
import { FieldPath, FieldValue } from "firebase-admin/firestore";

import db from "../modules/firestore";
import { getNowMoment } from "../utils";
import { MoundFirestore } from "../@types/firestore";
import { COLLECTIONS, REPORT_TYPES } from "../consts";
import { accessAuthentication } from "../modules/token";

const router = express.Router();

// 신고한 사용자 목록 조회
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
      message: "신고한 사용자 목록을 가져왔습니다.",
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
      message: "신고한 게시글 목록을 가져왔습니다.",
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
      message: "신고한 댓글 목록을 가져왔습니다.",
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
      text = "",
      reportType,
      targetId,
    } = req.body;

    if (reportType as MoundFirestore.ReportTypes === "etc" && !text?.trim()) {
      throw { s: 400, m: "내용이 없습니다." };
    }
    if (!REPORT_TYPES.includes(reportType)) {
      throw { s: 400, m: "잘못된 신고 타입입니다." };
    }
    if (!targetId) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }
    if (id === targetId) {
      throw { s: 403, m: "본인을 신고할 수 없습니다." };
    }

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

    const targetReportDocs = await userRef
      .collection(COLLECTIONS.USER_REPORT)
      .where("targetId", "==", targetId)
      .get();

    if (!targetReportDocs.empty) {
      throw { s: 403, m: "이미 신고한 사용자입니다." };
    }

    const {
      nickname,
      phone,
      verify,
      block,
      blockExpire,
      createdAt,
      updatedAt,
      reportCount,
    } = target.data() as MoundFirestore.User;

    const userReportAdd = await userRef
      .collection(COLLECTIONS.USER_REPORT)
      .add({
        text,
        reportType,
        targetId,
        userId: id,
        target: {
          nickname,
          phone,
          verify,
          block,
          blockExpire,
          createdAt,
          updatedAt,
          reportCount,
        },
        createdAt: getNowMoment(),
        updatedAt: getNowMoment(),
      });
    await target.ref.update({ reportCount: FieldValue.increment(1), updatedAt: getNowMoment() });

    const userReportDoc = await userReportAdd.get();

    return res.status(200).send({
      result: true,
      message: "사용자를 신고했습니다.",
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
      text = "",
      reportType,
      targetId,
    } = req.body;

    if (reportType as MoundFirestore.ReportTypes === "etc" && !text?.trim()) {
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

    const targetReportDocs = await userRef
      .collection(COLLECTIONS.POST_REPORT)
      .where("targetId", "==", targetId)
      .get();

    if (!targetReportDocs.empty) {
      throw { s: 403, m: "이미 신고한 게시글입니다." };
    }

    const { userId, ...other } = target.data() as MoundFirestore.Post;

    if (id === userId) {
      throw { s: 403, m: "본인 게시글을 신고할 수 없습니다." };
    }

    const postReportAdd = await userRef
      .collection(COLLECTIONS.POST_REPORT)
      .add({
        text,
        reportType,
        targetId,
        userId: id,
        target: { ...other },
        createdAt: getNowMoment(),
        updatedAt: getNowMoment(),
      });
    await target.ref.update({ reportCount: FieldValue.increment(1), updatedAt: getNowMoment() });

    const postReportDoc = await postReportAdd.get();

    return res.status(200).send({
      result: true,
      message: "게시글을 신고했습니다.",
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
      text = "",
      reportType,
      targetId,
      postId,
    } = req.body;
    
    if (reportType as MoundFirestore.ReportTypes === "etc" && !text?.trim()) {
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
      throw { s: 403, m: "신고할 댓글을 찾을 수 없습니다." };
    }

    const [target] = targetDocs.docs;

    const targetReportDocs = await userRef
      .collection(COLLECTIONS.POST_COMMENT_REPORT)
      .where("targetId", "==", targetId)
      .get();

    if (!targetReportDocs.empty) {
      throw { s: 403, m: "이미 신고한 댓글입니다." };
    }

    const { userId, ...other } = target.data() as MoundFirestore.PostComment;

    if (id === userId) {
      throw { s: 403, m: "본인 댓글을 신고할 수 없습니다." };
    }

    const commentReportAdd = await userRef
      .collection(COLLECTIONS.POST_COMMENT_REPORT)
      .add({
        text,
        reportType,
        targetId,
        postId: post.id,
        userId: id,
        post: { ...post.data() },
        target: { userId, ...other },
        createdAt: getNowMoment(),
        updatedAt: getNowMoment(),
      });
    await target.ref.update({ reportCount: FieldValue.increment(1), updatedAt: getNowMoment() });

    const commentReportDoc = await commentReportAdd.get();

    return res.status(200).send({
      result: true,
      message: "댓글을 신고했습니다.",
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
