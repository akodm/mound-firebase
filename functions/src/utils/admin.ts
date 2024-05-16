import { NextFunction, Request, Response } from "express";

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
