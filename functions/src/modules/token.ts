import jwt from "jsonwebtoken";

const { ACCESS_KEY, REFRESH_KEY } = process.env;

// Access Token 검증
export const accessVerify = (string: string, options: jwt.VerifyOptions = {}): string | Object => {
  try {
    const verify = jwt.verify(string, ACCESS_KEY as string, options);

    return verify.valueOf();
  } catch (err) {
    throw err;
  }
};

// Refresh Token 검증
export const refreshVerify = (string: string, options: jwt.VerifyOptions): string | Object => {
  try {
    const verify = jwt.verify(string, REFRESH_KEY as string, options);

    return verify.valueOf();
  } catch (err) {
    throw err;
  }
};

