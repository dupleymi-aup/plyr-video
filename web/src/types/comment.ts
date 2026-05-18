export interface CommentUser {
  id: string;
  name: string | null;
  image: string | null;
}

export interface CommentReply {
  id: string;
  content: string;
  createdAt: Date;
  user: CommentUser;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: CommentUser;
  _count: { replies: number };
  replies: CommentReply[];
}
