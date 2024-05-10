import { UserRecord, getAuth } from "firebase-admin/auth";
import { logger } from "firebase-functions/v1";

// SMS 인증된 사용자 불러오기
export const phoneVerify = async (number: string): Promise<UserRecord | null> => {
  try {
    return await getAuth().getUserByPhoneNumber(number); 
  } catch (err: any) {
    logger.log(`[인증]전화번호 인증 오류:`, number, err?.errorInfo?.code);
    return null;
  }
};

// 인증된 사용자 삭제
export const phoneDelete = async (uid: string): Promise<void> => {
  try {
    return await getAuth().deleteUser(uid);
  } catch (err: any) {
    logger.log(`[삭제]전화번호 인증 오류:`, uid, err?.errorInfo?.code);
    throw err;
  }
};
