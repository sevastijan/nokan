import { useState, useRef, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { CommentFormProps } from '@/app/types/globalTypes';
import { toast } from 'sonner';
import Avatar from '../Avatar/Avatar';
import Button from '../Button/Button';

interface MentionUser {
     id: string;
     name?: string | null;
     image?: string | null;
     custom_name?: string | null;
     custom_image?: string | null;
}

// Helper function to get display values
const getDisplayData = (user: MentionUser) => ({
     name: user.custom_name || user.name || 'User',
     image: user.custom_image || user.image,
});

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
     teamMembers: MentionUser[];
}) => {
     const { t } = useTranslation();
     const [newComment, setNewComment] = useState('');
     const [uploading, setUploading] = useState(false);
     const [showSuggestions, setShowSuggestions] = useState(false);
     const [suggestionIndex, setSuggestionIndex] = useState(0);
     const [mentionQuery, setMentionQuery] = useState('');
     const textareaRef = useRef<HTMLTextAreaElement>(null);

     // Get current user display data
     const currentUserDisplay = getDisplayData(currentUser);

     const filteredSuggestions = teamMembers
          .filter((u) => {
               const displayName = getDisplayData(u).name;
               return displayName.toLowerCase().includes(mentionQuery.toLowerCase());
          })
          .slice(0, 6);

     useEffect(() => {
          if (showSuggestions && filteredSuggestions.length > 0) {
               setSuggestionIndex(0);
          }
     }, [showSuggestions, filteredSuggestions]);

     const insertMention = (user: MentionUser) => {
          if (!textareaRef.current) return;
          const textarea = textareaRef.current;
          const cursor = textarea.selectionStart;

          const displayName = getDisplayData(user).name;
          const mentionText = `@${displayName}`;

          const textBefore = newComment.substring(0, cursor - mentionQuery.length - 1);
          const textAfter = newComment.substring(cursor);
          setNewComment(`${textBefore}${mentionText} ${textAfter}`);

          setShowSuggestions(false);
          setMentionQuery('');
          setTimeout(() => textarea.focus(), 0);
     };

     const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
          if (!showSuggestions) return;
          if (e.key === 'ArrowDown') {
               e.preventDefault();
               setSuggestionIndex((i) => (i + 1) % filteredSuggestions.length);
          } else if (e.key === 'ArrowUp') {
               e.preventDefault();
               setSuggestionIndex((i) => (i - 1 + filteredSuggestions.length) % filteredSuggestions.length);
          } else if (e.key === 'Enter' || e.key === 'Tab') {
               e.preventDefault();
               insertMention(filteredSuggestions[suggestionIndex]);
          } else if (e.key === 'Escape') {
               setShowSuggestions(false);
          }
     };

     const handlePaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
          const items = event.clipboardData.items;
          for (const item of items) {
               if (item.type.includes('image')) {
                    event.preventDefault();
                    const file = item.getAsFile();
                    if (!file) continue;
                    if (file.size > 10 * 1024 * 1024) {
                         toast.error(t('comments.imageTooLarge'));
                         return;
                    }
                    setUploading(true);
                    try {
                         const formData = new FormData();
                         formData.append('file', file);
                         formData.append('taskId', taskId);

                         const response = await fetch('/api/upload-comment-image', {
                              method: 'POST',
                              body: formData,
                         });

                         if (!response.ok) {
                              const err = await response.json();
                              throw new Error(err.error || 'Upload failed');
                         }

                         const { image } = await response.json();

                         if (!image?.signedUrl) throw new Error(t('comments.imageUrlFailed'));

                         const markdown = `![${image.file_name}](${image.signedUrl})`;
                         const textarea = event.target as HTMLTextAreaElement;
                         const start = textarea.selectionStart;
                         setNewComment(newComment.substring(0, start) + markdown + newComment.substring(start));

                         toast.success(t('comments.imagePasted'));
                    } catch (error) {
                         console.error(t('comments.imagePasteError'), error);
                         toast.error(t('comments.imagePasteFailed'));
                    } finally {
                         setUploading(false);
                    }
               }
          }
     };

     const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
          const value = e.target.value;
          setNewComment(value);

          const cursor = e.target.selectionStart;
          const textBefore = value.substring(0, cursor);
          const lastAt = textBefore.lastIndexOf('@');

          if (lastAt >= 0 && (lastAt === 0 || /\s/.test(textBefore[lastAt - 1]))) {
               const query = textBefore.substring(lastAt + 1);
               if (query && !/\s/.test(query)) {
                    setMentionQuery(query);
                    setShowSuggestions(true);
                    return;
               }
          }
          setShowSuggestions(false);
     };

     const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          if (!newComment.trim()) return;

          // Convert @Name to @{Name} for the parser
          let content = newComment.trim();
          for (const member of teamMembers) {
               const name = getDisplayData(member).name;
               content = content.replace(new RegExp(`@${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), `@{${name}}`);
          }

          onAddComment(content);

          setNewComment('');
          onCancelReply?.();
     };

     return (
          <div className="flex gap-3">
               <div className="shrink-0 w-7" />
               <div className="flex-1 relative">
                    {replyingTo && (
                         <div className="text-[11px] text-brand-400 mb-1.5 flex items-center gap-2">
                              <span>{t('comments.replyTo', { name: replyingTo.authorName })}</span>
                              <button onClick={onCancelReply} className="text-slate-500 hover:text-slate-300">
                                   <FaTimes size={10} />
                              </button>
                         </div>
                    )}
                    <form onSubmit={handleSubmit}>
                         <textarea
                              ref={textareaRef}
                              value={newComment}
                              onChange={handleChange}
                              onKeyDown={handleKeyDown}
                              onPaste={handlePaste}
                              placeholder={replyingTo ? t('comments.replyPlaceholder') : t('comments.addPlaceholder')}
                              className="w-full min-h-[60px] px-3 py-2 bg-slate-800 rounded-lg resize-none text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:bg-slate-750 transition"
                              disabled={uploading}
                              rows={2}
                         />
                         {showSuggestions && filteredSuggestions.length > 0 && (
                              <div className="absolute z-10 bg-slate-800 border border-slate-700 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-xl w-full" data-ignore-outside-click>
                                   {filteredSuggestions.map((user, i) => {
                                        const userDisplay = getDisplayData(user);
                                        return (
                                             <div
                                                  key={user.id}
                                                  className={`px-3 py-2 hover:bg-slate-700 cursor-pointer flex items-center gap-2 text-sm ${i === suggestionIndex ? 'bg-slate-700' : ''}`}
                                                  onMouseDown={(e) => {
                                                       e.preventDefault();
                                                       e.stopPropagation();
                                                       insertMention(user);
                                                  }}
                                             >
                                                  <Avatar src={userDisplay.image} alt={userDisplay.name} size={20} />
                                                  <span className="text-slate-200">{userDisplay.name}</span>
                                             </div>
                                        );
                                   })}
                              </div>
                         )}
                         {uploading && <div className="text-[11px] text-brand-400 mt-1">{t('comments.uploadingImage')}</div>}
                         <div className="flex items-center justify-end mt-1.5 gap-2">
                              <button
                                   type="submit"
                                   disabled={!newComment.trim() || uploading}
                                   className="text-xs font-medium text-brand-400 hover:text-brand-300 disabled:text-slate-600 disabled:cursor-not-allowed transition cursor-pointer"
                              >
                                   {replyingTo ? t('comments.reply') : t('comments.comment')} ↵
                              </button>
                         </div>
                    </form>
               </div>
          </div>
     );
};

export default CommentForm;
