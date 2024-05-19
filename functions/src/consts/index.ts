import { MoundFirestore } from "../@types/firestore";

export const COLLECTIONS: MoundFirestore.Collections = {
  USER: "user",
  TOKEN: "token",
  USER_REPORT: "userReport",
  POST_REPORT: "postReport",
  POST_COMMENT_REPORT: "postCommentReport",
  NOTICE: "notice",
  NOTIFICATION: "notification",
  PLACE_SUBSCRIPTION: "placeSubscription",
  POST: "post",
  POST_VIEW: "postView",
  POST_LIKE: "postLike",
  POST_MEDIA: "postMedia",
  POST_COMMENT: "postComment",
};
export const BEARER = "Bearer";
export const NEAR_TOKEN_ISSUE_DAY = 7;
