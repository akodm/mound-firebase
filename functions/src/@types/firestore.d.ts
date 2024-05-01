export declare namespace MoundFirestore {
  interface DateConstructor {
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

  interface User extends DateConstructor {
    id: string;
    account: string;
    password: string;
    phone: string;
    verify: boolean;
    termsToService: boolean;
    block: boolean;
    blockExpire: string;
    notice: boolean;
    comment: boolean;
    like: boolean;
    marketing: boolean;
  }

  interface Token extends DateConstructor {
    access: string;
    accessExpire: string;
    refresh: string;
    refreshExpire: string;
    userId: string;
  }

  interface Report extends DateConstructor {
    text: string;
    reportType: string;
    userId: string;
    postId?: string;
    postCommentId?: string;
    commentReplyId?: string;
  }

  interface Notice extends DateConstructor {
    title: string;
    content: string;
    read: boolean;
    userId: string;
  }

  interface Notification extends DateConstructor {
    title: string;
    content: string;
    data?: string;
    read: boolean;
    notificationType: string;
    userId: string;
  }

  interface PlaceSubscription extends DateConstructor, PlaceStructor {
    userId: string;
  }

  interface Post extends DateConstructor, PlaceStructor {
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

  interface PostView extends DateConstructor {
    postId: string;
    userId: string;
  }

  interface PostLike extends DateConstructor {
    postId: string;
    userId: string;
  }

  interface PostMedia extends DateConstructor {
    name: string;
    url: string;
    mimetype: string;
    size: number;
    postId: string;
    userId: string;
  }

  interface PostComment extends DateConstructor {
    text: string;
    likeCount: number;
    replyCount: number;
    reportCount: number;
    block: boolean;
    postId: string;
    userId: string;
  }

  interface CommentReply extends DateConstructor {
    text: string;
    likeCount: number;
    reportCount: number;
    block: boolean;
    postId: string;
    postCommentId: string;
    userId: string;
  }

  interface CommentLike extends DateConstructor {
    postCommentId: string;
    userId: string;
  }
}
