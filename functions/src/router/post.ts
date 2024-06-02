import express from "express";
import { FieldPath, Filter } from "firebase-admin/firestore";

import db from "../modules/firestore";
import { getNowMoment } from "../utils";
import { COLLECTIONS, IN_MAX } from "../consts";
import { EUPMYEONDONG } from "../consts/eupMyeonDong";
import { getArrayChildProcessor } from "../utils/admin";
import { accessAuthentication } from "../modules/token";
import { getParseLocation } from "../modules/place";

const router = express.Router();

// 지역 기반 전체 글 목록 반환 (지역 정보 없을 시 최근 생성 기준 반환)
router.get("/", async (req, res, next) => {
  try {
    const { codes = "[]" } = req.query;

    const codeArray = JSON.parse(codes as string);

    if (!Array.isArray(codeArray)) {
      throw { s: 400, m: "위치 구독이 잘못되었습니다." };
    }
    if (codeArray.length > IN_MAX) {
      throw { s: 400, m: `최대 요청 가능한 위치 구독 지역은 ${IN_MAX}개입니다.` };
    }

    let postDocs = null;

    if (codeArray.length) {
      postDocs = await db
        .collection(COLLECTIONS.POST)
        .where("place.code", "in", codeArray)
        .orderBy("updatedAt", "desc")
        .get();
    } else {
      postDocs = await db
        .collection(COLLECTIONS.POST)
        .orderBy("createdAt", "desc")
        .get();
    }

    const data = await getArrayChildProcessor(
      postDocs,
      {
        name: COLLECTIONS.POST_VIEW,
        relation: "many",
      },
      {
        name: COLLECTIONS.POST_LIKE,
        relation: "many",
      },
      {
        name: COLLECTIONS.POST_MEDIA,
        relation: "many",
      },
      {
        name: COLLECTIONS.POST_COMMENT,
        relation: "many",
      },
    );

    return res.status(200).send({
      result: true,
      message: "글 목록을 가져왔습니다.",
      data,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 검색 기반 전체 글 목록 반환
router.get("/search", async (req, res, next) => {
  try {
    const { text = "" } = req.query;

    let postDocs: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData, FirebaseFirestore.DocumentData> | null = null;

    if (text && typeof text !== "string") {
      throw { s: 400, m: "값이 잘못되었습니다." };
    }

    if (!text?.trim()) {
      postDocs = await db
        .collection(COLLECTIONS.POST)
        .orderBy("createdAt", "desc")
        .get();
    } else {
      const split = text.split(" ").slice(0, IN_MAX);

      postDocs = await db
        .collection(COLLECTIONS.POST)
        .where(Filter.or(
          Filter.where("title", "in", split),
          Filter.where("content", "in", split),
          Filter.where("place.siDo", "in", split),
          Filter.where("place.siGuGun", "in", split),
          Filter.where("place.eupMyeonDong", "in", split),
          Filter.where("place.location", "in", split),
        ))
        .orderBy("updatedAt", "desc")
        .get();
    }

    if (!postDocs) {
      throw { s: 500, m: "게시글을 불러오지 못했습니다." };
    }

    const data = await getArrayChildProcessor(
      postDocs,
      {
        name: COLLECTIONS.POST_VIEW,
        relation: "many",
      },
      {
        name: COLLECTIONS.POST_LIKE,
        relation: "many",
      },
      {
        name: COLLECTIONS.POST_MEDIA,
        relation: "many",
      },
      {
        name: COLLECTIONS.POST_COMMENT,
        relation: "many",
      },
    );

    return res.status(200).send({
      result: true,
      message: "글 목록을 가져왔습니다.",
      data,
      code: null,
    });
  } catch (err) {
    return next(err);
  }
});

// 사용자 기반 글 반환
router.get("/user", accessAuthentication, async (req, res, next) => {
  try {
    const { id } = req.user;

    const postDocs = await db
      .collection(COLLECTIONS.POST)
      .where("userId", "==", id)
      .get();

    const data = await getArrayChildProcessor(
      postDocs,
      {
        name: COLLECTIONS.POST_VIEW,
        relation: "many",
      },
      {
        name: COLLECTIONS.POST_LIKE,
        relation: "many",
      },
      {
        name: COLLECTIONS.POST_MEDIA,
        relation: "many",
      },
      {
        name: COLLECTIONS.POST_COMMENT,
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
        name: COLLECTIONS.POST_VIEW,
        relation: "many",
        isUser: true,
      },
      {
        name: COLLECTIONS.POST_LIKE,
        relation: "many",
        isUser: true,
      },
      {
        name: COLLECTIONS.POST_MEDIA,
        relation: "many",
      },
      {
        name: COLLECTIONS.POST_COMMENT,
        relation: "many",
        isUser: true,
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
    const { id: userId } = req.user;
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

    const { siDo, siGuGun, eupMyeonDong } = getParseLocation(place);

    const postAdd = await db
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
        place: {
          ...place,
          siDo, 
          siGuGun, 
          eupMyeonDong,
        },
        userId,
        createdAt: getNowMoment(),
        updatedAt: getNowMoment(),
      });

    const postDoc = await postAdd.get();

    return res.status(200).send({
      result: true,
      message: "글을 생성하였습니다.",
      data: {
        ...postDoc.data(),
        id: postDoc.id,
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
      updatedAt: getNowMoment(),
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
