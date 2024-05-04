import { UserRecord, getAuth } from "firebase-admin/auth";

// SMS 인증된 사용자 불러오기
export const phoneVerify = async (number: string): Promise<UserRecord> => {
  try {
    return await getAuth().getUserByPhoneNumber(number); 
  } catch (err) {
    throw err;
  }
};

// 인증된 사용자 삭제
export const phoneDelete = async (uid: string): Promise<void> => {
  try {
    return await getAuth().deleteUser(uid);
  } catch (err) {
    throw err;
  }
};
