export declare namespace MoundFirestore {
  interface DataJson {
    [x: string]: any;
  }

  type ReportTypes = 
    "advertisement" | 
    "swear" | 
    "location_belittle" |
    "illegal_link" |
    "etc";

  interface GetChildCollections {
    name: string;
    relation: "one" | "many";
    isUser?: boolean;
  }

  interface PlaceSearch {
    isSiDo?: boolean;
    isSiGuGun?: boolean;
    isEupMyeonDong?: boolean;
  }

  interface Placement {
    siDo?: string;
    siGuGun?: string;
    eupMyeonDong?: string;
  }

  interface Collections {
    USER: "user";
    TOKEN: "token";
    EMAIL_AUTH: "emailAuth",
    USER_REPORT: "userReport";
    POST_REPORT: "postReport";
    POST_COMMENT_REPORT: "postCommentReport";
    NOTICE: "notice";
    NOTIFICATION: "notification";
    PLACE_SUBSCRIPTION: "placeSubscription";
    POST: "post";
    POST_VIEW: "postView";
    POST_LIKE: "postLike";
    POST_MEDIA: "postMedia";
    POST_COMMENT: "postComment";
  }

  interface Constructor {
    id: string;
    createdAt: string;
    updatedAt: string;
  }

  interface PlaceStructor {
    location: string;
    siDo: string;
    siGuGun: string;
    eupMyeonDong: string;
    code: string;
    latitude: string;
    longitude: string;
  }

  interface User extends Constructor {
    uid: string;
    account: string;
    nickname: string;
    password: string;
    email: string;
    phone: string;
    verify: boolean;
    termsToService: boolean;
    reportCount: 0;
    failCount: number;
    block: boolean;
    blockExpire: string | null;
    notice: boolean;
    comment: boolean;
    like: boolean;
    marketing: boolean;
  }

  interface Token extends Constructor {
    fcm: string;
    userAgent: string;
    access: string;
    accessExpire: string;
    refresh: string;
    refreshExpire: string;
    userId: string;
  }

  interface EmailAuth extends Constructor {
    code: string;
    verify: boolean;
    expire: number;
    log: string;
    userId: string;
  }

  interface UserReport extends Constructor {
    text: string;
    reportType: string;
    targetId: ReportTypes;
    userId: string;
    target: User;
    user: User;
  }

  interface PostReport extends Constructor {
    text: string;
    reportType: ReportTypes;
    targetId: string;
    userId: string;
    target: Post;
    user: User;
  }

  interface PostCommentReport extends Constructor {
    text: string;
    reportType: ReportTypes;
    targetId: string;
    postId: string;
    userId: string;
    target: PostComment;
    post: Post;
    user: User;
  }

  interface Notice extends Constructor {
    title: string;
    content: string;
    read: boolean;
    userId: string;
    user: User;
  }

  interface Notification extends Constructor {
    title: string;
    content: string;
    data?: string;
    read: boolean;
    notificationType: string;
    userId: string;
  }

  interface PlaceSubscription extends Constructor, PlaceStructor {
    userId: string;
  }

  interface Post extends Constructor {
    title: string;
    content: string;
    exactly: boolean;
    likeCount: number;
    viewCount: number;
    commentCount: number;
    reportCount: number;
    block: boolean;
    userId: string;
    place: PlaceStructor;
    user: User;
  }

  interface PostView extends Constructor {
    postId: string;
    userId: string;
    post: Post;
    user: User;
  }

  interface PostLike extends Constructor {
    postId: string;
    userId: string;
    post: Post;
    user: User;
  }

  interface PostMedia extends Constructor {
    name: string;
    url: string;
    mimetype: string;
    size: number;
    postId: string;
    userId: string;
    user: User;
  }

  interface PostComment extends Constructor {
    text: string;
    reportCount: number;
    block: boolean;
    postId: string;
    postCommentId?: string;
    userId: string;
    postComment?: PostComment;
    post: Post;
    user: User;
  }
}
