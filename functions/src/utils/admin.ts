import { NextFunction, Request, Response } from "express";
import { FieldPath } from "firebase-admin/firestore";

import db from "../modules/firestore";
import { COLLECTIONS } from "../consts";
import { GlobalTypes } from "../@types/types";
import { MoundFirestore } from "../@types/firestore";

const { TEST_CODE } = process.env;

// 테스트용 키 포함 처리
export const TestKeyInclude = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const method = req.method;

    switch (method) {
      case "GET":
      case "DELETE": {
        if (req.query.key !== TEST_CODE) {
          throw { s: 403, m: "관리자 코드가 다릅니다." };
        }
        break;
      }
      default: {
        if (req.body.key !== TEST_CODE) {
          throw { s: 403, m: "관리자 코드가 다릅니다." };
        }
        break;
      }
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

// 하위 컬렉션 조회 및 병합
export const getChildCollections = async (ref: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData, FirebaseFirestore.DocumentData>, ...args: MoundFirestore.GetChildCollections[]) => {
  try {
    const json: GlobalTypes.EmptyJson = {};

    const getDocumentData = async (arg: MoundFirestore.GetChildCollections) => {
      const argDocs = await ref
        .collection(arg.name)
        .get();

      if (argDocs.empty) {
        switch (arg.relation) {
          case "one":
            json[arg.name] = null;
          case "many":
          default:
            json[arg.name] = [];
        }
      } else {
        switch (arg.relation) {
          case "one":
            const [doc = null]: GlobalTypes.EmptyJson[] | null[] = argDocs.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

            json[arg.name] = doc ? doc : null;

            if (arg.isUser && json[arg.name]?.userId) {
              const user = await getUserCollection(json[arg.name].userId);

              if (user?.id) {
                json[arg.name][COLLECTIONS.USER] = await getUserCollection(json[arg.name].userId);
              }
            }
  
            break;
          case "many":
          default:
            json[arg.name] = argDocs.docs.reduce((res: GlobalTypes.EmptyJson, crr) => {
              if (crr?.id) {
                res.push({ ...crr.data(), id: crr.id });
              }
  
              return res;
            }, []);

            const getArrayUserCollection = async (jsonItem: GlobalTypes.EmptyJson) => {
              if (jsonItem?.userId) {
                const user = await getUserCollection(jsonItem.userId);

                if (user?.id) {
                  jsonItem[COLLECTIONS.USER] = await getUserCollection(jsonItem.userId);
                }
              }
            };

            if (arg.isUser) {
              await Promise.all(json[arg.name].map(getArrayUserCollection));
            }

            break;
        }
      }
    };

    await Promise.all(args.map(getDocumentData));

    return json;
  } catch (err) {
    throw err;
  }
};

// 하위 컬렉션 조회 실행 함수
export const getArrayChildProcessor = async (querySnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData, FirebaseFirestore.DocumentData>, ...args: MoundFirestore.GetChildCollections[]): Promise<FirebaseFirestore.DocumentData[]> => {
  try {
    if (querySnapshot.empty) {
      return [];
    }

    const processing = async (doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData, FirebaseFirestore.DocumentData>): Promise<FirebaseFirestore.DocumentData> => {
      try {
        const json = await getChildCollections(doc.ref, ...args);
        const docData = { ...doc.data(), id: doc.id } as GlobalTypes.EmptyJson;

        if (docData.userId) {
          docData.user = await getUserCollection(docData.userId);
        }

        return {
          ...json,
          ...docData,
        };
      } catch (err) {
        throw err;
      }
    };

    return await Promise.all(querySnapshot.docs.map(processing));
  } catch (err) {
    throw err;
  }
};

// 상위 컬렉션 조회 함수
export const getParentCollection = async (querySnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData, FirebaseFirestore.DocumentData>, key: string) => {
  try {
    if (querySnapshot.empty) {
      return [];
    }

    const processing = async (doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData, FirebaseFirestore.DocumentData>): Promise<FirebaseFirestore.DocumentData> => {
      try {
        const json: GlobalTypes.EmptyJson = { ...doc.data(), id: doc.id };
        const parent = await doc.ref.parent.parent?.get();

        if (json.userId) {
          json.user = await getUserCollection(json.userId);
        }

        if (!parent?.exists) {
          return {
            ...json,
            [key]: null,
          };
        }

        const { userId, ...args } = parent.data() as GlobalTypes.EmptyJson;
        const parentData = { ...args };

        if (userId) {
          parentData.userId = userId;
          parentData.user = await getUserCollection(userId);
        }

        return {
          ...json,
          [key]: {
            ...parentData,
            id: parent.id,
          },
        };
      } catch (err) {
        throw err;
      }
    }

    return await Promise.all(querySnapshot.docs.map(processing));
  } catch (err) {
    throw err;
  }
};

// 사용자 아이디 기반 조회
export const getUserCollection = async (id: string): Promise<FirebaseFirestore.DocumentData | null> => {
  try {
    const userDocs = await db
      .collection(COLLECTIONS.USER)
      .where(FieldPath.documentId(), "==", id)
      .get();

    if (userDocs.empty) {
      return null;
    }

    const [user] = userDocs.docs;
    const { nickname, reportCount, block, blockExpire, verify } = user.data();

    return {
      id,
      nickname, 
      reportCount,
      block, 
      blockExpire, 
      verify,
    };
  } catch (err) {
    throw err;
  }
};
