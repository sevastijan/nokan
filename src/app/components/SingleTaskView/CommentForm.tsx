import { useCallback } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { CommentFormProps } from '@/app/types/globalTypes';
import CommentEditor from './CommentEditor';
import type { User } from '@/app/types/globalTypes';

const CommentForm = ({
     currentUser,
     taskId,
     onAddComment,
     replyingTo,
     onCancelReply,
     teamMembers = [],
}: CommentFormProps & {
     replyingTo?: { id: string; authorName: string };
     onCancelReply?: () => void;
     teamMembers: User[];
}) => {
     const { t } = useTranslation();

     const handleSubmit = useCallback((html: string) => {
          onAddComment(html);
          onCancelReply?.();
     }, [onAddComment, onCancelReply]);

     return (
          <div className="flex gap-3">
               <div className="shrink-0 w-7" />
               <div className="flex-1">
                    {replyingTo && (
                         <div className="text-[11px] text-brand-400 mb-1.5 flex items-center gap-2">
                              <span>{t('comments.replyTo', { name: replyingTo.authorName })}</span>
                              <button onClick={onCancelReply} className="text-slate-500 hover:text-slate-300">
                                   <FaTimes size={10} />
                              </button>
                         </div>
                    )}
                    <CommentEditor
                         placeholder={replyingTo ? t('comments.replyPlaceholder') : t('comments.addPlaceholder')}
                         teamMembers={teamMembers}
                         onSubmit={handleSubmit}
                         taskId={taskId}
                    />
                    <div className="flex items-center justify-end mt-1">
                         <span className="text-[10px] text-slate-600">Enter — wyślij · Shift+Enter — nowa linia · @ — oznacz</span>
                    </div>
               </div>
          </div>
     );
};

export default CommentForm;
