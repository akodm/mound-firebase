import { MoundFirestore } from "../@types/firestore";

export const COLLECTIONS: MoundFirestore.Collections = {
  USER: "user",
  EMAIL_AUTH: "emailAuth",
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
export const PASSWORD_MAX_FAIL = 5;
export const IN_MAX = 30;
export const NOT_IN_MAX = 10;
export const BEARER = "Bearer";
export const NEAR_TOKEN_ISSUE_DAY = 7;
export const REPORT_TYPES: MoundFirestore.ReportTypes[] = [
  "advertisement", "location_belittle", "etc", "illegal_link", "swear",
];