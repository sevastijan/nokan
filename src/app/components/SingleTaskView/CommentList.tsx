import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaReply, FaTrash } from 'react-icons/fa';
import { formatDate } from '@/app/utils/helpers';
import MarkdownContent from '@/app/components/MarkdownContent/MarkdownContent';
import Avatar from '../Avatar/Avatar';
import CommentForm from './CommentForm';
import { Comment, CommentListProps, TaskDetail, User } from '@/app/types/globalTypes';

interface ExtendedAuthor {
     id: string;
     name: string | null | undefined;
     email: string;
     image?: string | null;
     custom_name?: string | null;
     custom_image?: string | null;
}

interface ExtendedComment extends Omit<Comment, 'author' | 'replies'> {
     author: ExtendedAuthor;
     replies?: ExtendedComment[];
}

interface ExtendedUser extends User {
     custom_name?: string | null;
     custom_image?: string | null;
}

const getDisplayData = (user: { name: string | null | undefined; image?: string | null; custom_name?: string | null; custom_image?: string | null }) => ({
     name: user.custom_name || user.name || 'User',
     image: user.custom_image || user.image,
});

interface CommentItemProps {
     comment: ExtendedComment;
     depth?: number;
     currentUser: ExtendedUser;
     task: TaskDetail;
     onDeleteComment: (id: string) => Promise<void>;
     onImagePreview: (url: string) => void;
     onAddComment: (content: string, parentId?: string) => Promise<void>;
     teamMembers: ExtendedUser[];
}

const CommentItem = ({ comment, depth = 0, currentUser, task, onDeleteComment, onImagePreview, onAddComment, teamMembers }: CommentItemProps) => {
     const [replying, setReplying] = useState(false);

     const authorDisplay = getDisplayData({
          name: comment.author.name,
          image: comment.author.image,
          custom_name: comment.author.custom_name,
          custom_image: comment.author.custom_image,
     });

     return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`${depth > 0 ? 'ml-10 border-l-2 border-gray-600 pl-4' : 'bg-gray-700/50 rounded-lg p-4 mb-4'}`}>
               <div className="flex items-start gap-3">
                    <Avatar src={authorDisplay.image || undefined} alt={authorDisplay.name} size={32} />
                    <div className="flex-1">
                         <div className="flex items-center gap-2 text-xs mb-1">
                              <span className="font-medium text-gray-200">{authorDisplay.name}</span>
                              <span className="text-gray-400">{formatDate(comment.created_at)}</span>
                         </div>

                         <div className="text-gray-300 text-sm mb-3">
                              <MarkdownContent content={comment.content} onImageClick={onImagePreview} />
                         </div>

                         <div className="flex items-center gap-4 text-xs">
                              <button onClick={() => setReplying(true)} className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                   <FaReply className="w-3 h-3" /> Odpowiedz
                              </button>
                              {(comment.user_id === currentUser.id || task.user_id === currentUser.id) && (
                                   <button onClick={() => onDeleteComment(comment.id)} className="text-red-400 hover:text-red-300">
                                        <FaTrash className="w-3 h-3" />
                                   </button>
                              )}
                         </div>

                         {replying && (
                              <div className="mt-4">
                                   <CommentForm
                                        currentUser={currentUser}
                                        taskId={task.id!}
                                        onAddComment={(content) => onAddComment(content, comment.id)}
                                        replyingTo={{ id: comment.id, authorName: authorDisplay.name }}
                                        onCancelReply={() => setReplying(false)}
                                        teamMembers={teamMembers}
                                   />
                              </div>
                         )}

                         {comment.replies && comment.replies.length > 0 && (
                              <div className="mt-4 space-y-4">
                                   {comment.replies.map((reply) => (
                                        <CommentItem
                                             key={reply.id}
                                             comment={reply}
                                             depth={depth + 1}
                                             currentUser={currentUser}
                                             task={task}
                                             onDeleteComment={onDeleteComment}
                                             onImagePreview={onImagePreview}
                                             onAddComment={onAddComment}
                                             teamMembers={teamMembers}
                                        />
                                   ))}
                              </div>
                         )}
                    </div>
               </div>
          </motion.div>
     );
};

const CommentList = ({
     comments,
     currentUser,
     task,
     onDeleteComment,
     onImagePreview,
     teamMembers,
     onAddComment,
}: CommentListProps & {
     teamMembers: ExtendedUser[];
     onAddComment: (content: string, parentId?: string) => Promise<void>;
}) => {
     const buildTree = (comments: Comment[]): ExtendedComment[] => {
          const map = new Map<string, ExtendedComment>();
          const roots: ExtendedComment[] = [];

          comments.forEach((c) => {
               const authorWithCustoms = c.author as ExtendedAuthor;
               const comment: ExtendedComment = {
                    ...c,
                    replies: [],
                    author: {
                         id: c.author.id,
                         name: c.author.name,
                         email: c.author.email,
                         image: c.author.image,
                         custom_name: authorWithCustoms.custom_name,
                         custom_image: authorWithCustoms.custom_image,
                    },
               };
               map.set(c.id, comment);
          });

          comments.forEach((c) => {
               if (c.parent_id && map.has(c.parent_id)) {
                    map.get(c.parent_id)!.replies!.push(map.get(c.id)!);
               } else {
                    roots.push(map.get(c.id)!);
               }
          });

          const sortNode = (node: ExtendedComment) => {
               if (node.replies) {
                    node.replies.sort((a, b) => a.created_at.localeCompare(b.created_at));
                    node.replies.forEach(sortNode);
               }
          };
          roots.forEach(sortNode);
          roots.sort((a, b) => a.created_at.localeCompare(b.created_at));

          return roots;
     };

     const tree = buildTree(comments);

     if (comments.length === 0) {
          return <div className="text-center text-gray-400 py-8 text-sm">Brak komentarzy. Bądź pierwszy!</div>;
     }

     return (
          <div className="space-y-6">
               {tree.map((comment) => (
                    <CommentItem
                         key={comment.id}
                         comment={comment}
                         currentUser={currentUser as ExtendedUser}
                         task={task}
                         onDeleteComment={onDeleteComment}
                         onImagePreview={onImagePreview}
                         onAddComment={onAddComment}
                         teamMembers={teamMembers}
                    />
               ))}
          </div>
     );
};

export default CommentList;
