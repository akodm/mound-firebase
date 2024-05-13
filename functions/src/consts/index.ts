import { MoundFirestore } from "../@types/firestore";

export const COLLECTIONS: MoundFirestore.Collections = {
  USER: "user",
  TOKEN: "token",
  REPORT: "report",
  NOTICE: "notice",
  NOTIFICATION: "notification",
  PLACE_SUBSCRIPTION: "placeSubscription",
  POST: "post",
  POST_VIEW: "postView",
  POST_LIKE: "postLike",
  POST_MEDIA: "postMedia",
  POST_COMMENT: "postComment",
  COMMENT_REPLY: "commentReply",
  COMMENT_LIKE: "commentLike",
};
export const BEARER = "Bearer";
export const NEAR_TOKEN_ISSUE_DAY = 7;
