export declare namespace MoundFirestore {
  interface DataJson {
    [x: string]: any;
  }

  interface PlaceSearch {
    isSiDo?: boolean;
    isSiGuGun?: boolean;
    isEupMyeonDong?: boolean;
  }

  interface Collections {
    USER: "user";
    TOKEN: "token";
    REPORT: "report";
    NOTICE: "notice";
    NOTIFICATION: "notification";
    PLACE_SUBSCRIPTION: "placeSubscription";
    POST: "post";
    POST_VIEW: "postView";
    POST_LIKE: "postLike";
    POST_MEDIA: "postMedia";
    POST_COMMENT: "postComment";
    COMMENT_REPLY: "commentReply";
    COMMENT_LIKE: "commentLike";
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
    password: string;
    phone: string;
    verify: boolean;
    termsToService: boolean;
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

  interface Report extends Constructor {
    text: string;
    reportType: string;
    userId: string;
    postId?: string;
    postCommentId?: string;
    commentReplyId?: string;
  }

  interface Notice extends Constructor {
    title: string;
    content: string;
    read: boolean;
    userId: string;
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

  interface Post extends Constructor, PlaceStructor {
    title: string;
    content: string;
    exactly: boolean;
    likeCount: number;
    viewCount: number;
    commentCount: number;
    reportCount: number;
    block: boolean;
    userId: string;
  }

  interface PostView extends Constructor {
    postId: string;
    userId: string;
  }

  interface PostLike extends Constructor {
    postId: string;
    userId: string;
  }

  interface PostMedia extends Constructor {
    name: string;
    url: string;
    mimetype: string;
    size: number;
    postId: string;
    userId: string;
  }

  interface PostComment extends Constructor {
    text: string;
    likeCount: number;
    replyCount: number;
    reportCount: number;
    block: boolean;
    postId: string;
    userId: string;
  }

  interface CommentReply extends Constructor {
    text: string;
    likeCount: number;
    reportCount: number;
    block: boolean;
    postId: string;
    postCommentId: string;
    userId: string;
  }

  interface CommentLike extends Constructor {
    postCommentId: string;
    userId: string;
  }
}
