import { BatchResponse, MulticastMessage, getMessaging } from "firebase-admin/messaging";

// 단일 푸시 알림 보내기
export const sendMessaging = async (token: string, data = {}): Promise<string> => {
  try {
    return await getMessaging().send({
      token,
      data,
    });
  } catch (err) {
    throw err;
  }
};

// 모든 사용자에게 알림 보내기 (공지사항, 마케팅 등)
export const sendMessagingMultiple = async (message: MulticastMessage, dryRun?: boolean): Promise<BatchResponse> => {
  try {
    return await getMessaging().sendEachForMulticast(message, dryRun);
  } catch (err) {
    throw err;
  }
};
