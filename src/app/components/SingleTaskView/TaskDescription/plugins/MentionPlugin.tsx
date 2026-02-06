'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
     $getSelection,
     $isRangeSelection,
     $createTextNode,
     TextNode,
     COMMAND_PRIORITY_LOW,
     KEY_ARROW_DOWN_COMMAND,
     KEY_ARROW_UP_COMMAND,
     KEY_ENTER_COMMAND,
     KEY_ESCAPE_COMMAND,
     KEY_TAB_COMMAND,
} from 'lexical';
import { createPortal } from 'react-dom';
import Avatar from '@/app/components/Avatar/Avatar';
import { $createMentionNode } from '../nodes/MentionNode';

interface MentionUser {
     id: string;
     name?: string | null;
     image?: string | null;
     custom_name?: string | null;
     custom_image?: string | null;
}

const getDisplayData = (user: MentionUser) => ({
     name: user.custom_name || user.name || 'User',
     image: user.custom_image || user.image,
});

interface MentionPluginProps {
     teamMembers: MentionUser[];
}

export function MentionPlugin({ teamMembers }: MentionPluginProps) {
     const [editor] = useLexicalComposerContext();
     const [query, setQuery] = useState('');
     const [showDropdown, setShowDropdown] = useState(false);
     const [selectedIndex, setSelectedIndex] = useState(0);
     const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

     const filteredMembers = teamMembers
          .filter((u) => {
               const displayName = getDisplayData(u).name;
               return displayName.toLowerCase().includes(query.toLowerCase());
          })
          .slice(0, 6);

     const insertMention = useCallback(
          (user: MentionUser) => {
               editor.update(() => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)) return;

                    const anchor = selection.anchor;
                    const anchorNode = anchor.getNode();

                    if (!(anchorNode instanceof TextNode)) return;

                    const text = anchorNode.getTextContent();
                    const anchorOffset = anchor.offset;

                    const beforeCursor = text.substring(0, anchorOffset);
                    const atIndex = beforeCursor.lastIndexOf('@');
                    if (atIndex === -1) return;

                    const displayName = getDisplayData(user).name;
                    const beforeAt = text.substring(0, atIndex);
                    const afterCursor = text.substring(anchorOffset);

                    const mentionNode = $createMentionNode(displayName);
                    const trailingNode = $createTextNode(' ' + afterCursor);

                    if (atIndex === 0) {
                         anchorNode.setTextContent('');
                         anchorNode.insertAfter(trailingNode);
                         anchorNode.insertAfter(mentionNode);
                         anchorNode.remove();
                    } else {
                         anchorNode.setTextContent(beforeAt);
                         anchorNode.insertAfter(trailingNode);
                         anchorNode.insertAfter(mentionNode);
                    }

                    trailingNode.select(1, 1);
               });

               setShowDropdown(false);
               setQuery('');
          },
          [editor],
     );

     // Listen for text changes to detect @ mentions
     useEffect(() => {
          return editor.registerUpdateListener(({ editorState }) => {
               editorState.read(() => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
                         setShowDropdown(false);
                         return;
                    }

                    const anchor = selection.anchor;
                    const anchorNode = anchor.getNode();

                    if (!(anchorNode instanceof TextNode)) {
                         setShowDropdown(false);
                         return;
                    }

                    const text = anchorNode.getTextContent();
                    const cursorOffset = anchor.offset;
                    const textBefore = text.substring(0, cursorOffset);

                    const lastAtIndex = textBefore.lastIndexOf('@');

                    if (lastAtIndex >= 0 && (lastAtIndex === 0 || /\s/.test(textBefore[lastAtIndex - 1]))) {
                         const mentionQuery = textBefore.substring(lastAtIndex + 1);

                         if (mentionQuery.includes(' ')) {
                              setShowDropdown(false);
                              return;
                         }

                         setQuery(mentionQuery);
                         setShowDropdown(true);
                         setSelectedIndex(0);

                         const domSelection = window.getSelection();
                         if (domSelection && domSelection.rangeCount > 0) {
                              const range = domSelection.getRangeAt(0);
                              const rect = range.getBoundingClientRect();
                              setPosition({
                                   top: rect.bottom + window.scrollY + 4,
                                   left: rect.left + window.scrollX,
                              });
                         }
                    } else {
                         setShowDropdown(false);
                    }
               });
          });
     }, [editor]);

     // Register keyboard commands for dropdown navigation
     useEffect(() => {
          if (!showDropdown) return;

          const unregisterDown = editor.registerCommand(
               KEY_ARROW_DOWN_COMMAND,
               (e) => {
                    e?.preventDefault();
                    setSelectedIndex((i) => (i + 1) % filteredMembers.length);
                    return true;
               },
               COMMAND_PRIORITY_LOW,
          );

          const unregisterUp = editor.registerCommand(
               KEY_ARROW_UP_COMMAND,
               (e) => {
                    e?.preventDefault();
                    setSelectedIndex((i) => (i - 1 + filteredMembers.length) % filteredMembers.length);
                    return true;
               },
               COMMAND_PRIORITY_LOW,
          );

          const unregisterEnter = editor.registerCommand(
               KEY_ENTER_COMMAND,
               (e) => {
                    if (filteredMembers.length > 0) {
                         e?.preventDefault();
                         insertMention(filteredMembers[selectedIndex]);
                         return true;
                    }
                    return false;
               },
               COMMAND_PRIORITY_LOW,
          );

          const unregisterTab = editor.registerCommand(
               KEY_TAB_COMMAND,
               (e) => {
                    if (filteredMembers.length > 0) {
                         e?.preventDefault();
                         insertMention(filteredMembers[selectedIndex]);
                         return true;
                    }
                    return false;
               },
               COMMAND_PRIORITY_LOW,
          );

          const unregisterEsc = editor.registerCommand(
               KEY_ESCAPE_COMMAND,
               () => {
                    setShowDropdown(false);
                    return true;
               },
               COMMAND_PRIORITY_LOW,
          );

          return () => {
               unregisterDown();
               unregisterUp();
               unregisterEnter();
               unregisterTab();
               unregisterEsc();
          };
     }, [editor, showDropdown, filteredMembers, selectedIndex, insertMention]);

     if (!showDropdown || filteredMembers.length === 0 || !position) return null;

     return createPortal(
          <div className="fixed z-100 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-48 overflow-y-auto w-56" style={{ top: position.top, left: position.left }}>
               {filteredMembers.map((user, i) => {
                    const userDisplay = getDisplayData(user);
                    return (
                         <div
                              key={user.id}
                              className={`px-3 py-2 hover:bg-slate-700 cursor-pointer flex items-center gap-2 text-sm ${i === selectedIndex ? 'bg-slate-700' : ''}`}
                              onMouseDown={(e) => {
                                   e.preventDefault();
                                   insertMention(user);
                              }}
                         >
                              <Avatar src={userDisplay.image} alt={userDisplay.name} size={20} />
                              <span className="text-slate-200 truncate">{userDisplay.name}</span>
                         </div>
                    );
               })}
          </div>,
          document.body,
     );
}
