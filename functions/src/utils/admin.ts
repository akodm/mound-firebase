import { NextFunction, Request, Response } from "express";

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
    const json: any = {};

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
            const [doc] = argDocs.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  
            json[arg.name] = doc ? doc : null;
            break;
          case "many":
          default:
            json[arg.name] = argDocs.docs.reduce((res: any[], crr) => {
              if (crr?.id) {
                res.push({ ...crr.data(), id: crr.id });
              }
  
              return res;
            }, []);
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

        return {
          ...doc.data(),
          ...json,
          id: doc.id,
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
        const json = { ...doc.data(), id: doc.id };
        const parent = await doc.ref.parent.get();

        if (parent.empty) {
          return {
            ...json,
            [key]: null,
          };
        }

        return {
          ...json,
          [key]: parent.docs.map((doc) => ({ ...doc.data(), id: doc.id, name: doc.ref.path })),
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
