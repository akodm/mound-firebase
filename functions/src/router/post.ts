import express from "express";
import { FieldPath } from "firebase-admin/firestore";

import db from "../modules/firestore";
import { COLLECTIONS } from "../consts";
import { EUPMYEONDONG } from "../consts/eupMyeonDong";
import { getArrayChildProcessor } from "../utils/admin";
import { accessAuthentication } from "../modules/token";

const router = express.Router();

// 지역 기반 전체 글 목록 반환 (페이지네이션 기본, 지역 정보 없을 시 최근 생성 기준 반환)
router.get("/", async (req, res, next) => {
  try {
    return res.status(200).send({
      result: true,
      message: "글 목록을 가져왔습니다.",
      data: [],
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 아이디 기반 글 반환
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const postDocs = await db
      .collection(COLLECTIONS.POST)
      .where(FieldPath.documentId(), "==", id)
      .get();

    const [data = null] = await getArrayChildProcessor(
      postDocs,
      {
        name: "postView",
        relation: "many",
      },
      {
        name: "postLike",
        relation: "many",
      },
      {
        name: "postMedia",
        relation: "many",
      },
      {
        name: "postComment",
        relation: "many",
      },
    );

    return res.status(200).send({
      result: true,
      message: "글을 가져왔습니다.",
      data,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 글 생성
router.post("/", accessAuthentication, async (req, res, next) => {
  try {
    const { id, user } = req.user;
    const {
      title = "",
      content,
      exactly = false,
      latitude,
      longitude,
      code,
    } = req.body;

    if (!code) {
      throw { s: 400, m: "장소를 확인할 수 없습니다." };
    }
    if (!content?.trim()) {
      throw { s: 400, m: "내용이 없습니다." };
    }
    if (!latitude || !longitude) {
      throw { s: 400, m: "사용자 위치를 확인할 수 없습니다." };
    }

    const place = EUPMYEONDONG.find((eupMyeonDong) => eupMyeonDong.code === code);

    if (!place) {
      throw { s: 400, m: "해당 장소는 존재하지 않습니다." };
    }

    const post = await db
      .collection(COLLECTIONS.POST)
      .add({
        title,
        content,
        exactly,
        likeCount: 0,
        viewCount: 0,
        commentCount: 0,
        reportCount: 0,
        block: false,
        userId: id,
        ...place,
        ...user,
      });

    const postDoc = await post.get();

    return res.status(200).send({
      result: true,
      message: "글을 생성하였습니다.",
      data: {
        id: postDoc.id,
        ...postDoc.data(),
      },
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 글 수정
router.put("/", accessAuthentication, async (req, res, next) => {
  try {
    const { id } = req.user;
    const {
      id: postId,
      title,
      content,
      exactly,
    } = req.body;

    if (!postId) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }
    if (!content?.trim()) {
      throw { s: 400, m: "내용이 없습니다." };
    }

    const postDocs = await db
      .collection(COLLECTIONS.POST)
      .where(FieldPath.documentId(), "==", postId)
      .where("userId", "==", id)
      .get();

    if (postDocs.empty) {
      throw { s: 403, m: "글을 찾을 수 없습니다." };
    }

    const [post] = postDocs.docs;

    await post.ref.set({
      title,
      content,
      exactly,
    }, { merge: true });

    return res.status(200).send({
      result: true,
      message: "글을 수정하였습니다.",
      data: true,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 아이디 기반 글 삭제
router.delete("/:id", accessAuthentication, async (req, res, next) => {
  try {
    const { id } = req.user;
    const { id: postId } = req.params;

    if (!postId) {
      throw { s: 400, m: "필수 값이 비어있습니다." };
    }

    const postDocs = await db
      .collection(COLLECTIONS.POST)
      .where(FieldPath.documentId(), "==", postId)
      .where("userId", "==", id)
      .get();

    if (postDocs.empty) {
      throw { s: 403, m: "글을 찾을 수 없습니다." };
    }

    const [post] = postDocs.docs;

    await post.ref.delete();

    return res.status(200).send({
      result: true,
      message: "글을 삭제하였습니다.",
      data: true,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
