import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { ImageNode } from '../nodes/ImageNode';
import { MentionNode } from '../nodes/MentionNode';

export const editorConfig = {
     namespace: 'TaskDescriptionEditor',
     theme: {
          root: 'p-3 border-none focus:outline-none min-h-[120px] max-h-[400px] overflow-y-auto text-slate-100',
          link: 'text-purple-400 hover:text-purple-300 underline cursor-pointer',
          text: {
               bold: 'font-bold',
               italic: 'italic',
               underline: 'underline',
               strikethrough: 'line-through',
               code: 'bg-slate-700 px-1 py-0.5 rounded font-mono text-sm',
          },
          paragraph: 'mb-2',
          heading: {
               h1: 'text-2xl font-bold mb-3 mt-4',
               h2: 'text-xl font-bold mb-2 mt-3',
               h3: 'text-lg font-bold mb-2 mt-2',
          },
          list: {
               ul: 'list-disc ml-6 mb-2',
               ol: 'list-decimal ml-6 mb-2',
               listitem: 'mb-1',
          },
          quote: 'border-l-4 border-slate-600 pl-4 italic my-3 text-slate-300',
          code: 'bg-slate-800 p-3 rounded-lg font-mono text-sm mb-3 block overflow-x-auto',
     },
     onError: (error: Error) => {
          console.error('Lexical Error:', error);
     },
     nodes: [HeadingNode, ListNode, ListItemNode, QuoteNode, CodeNode, CodeHighlightNode, LinkNode, ImageNode, MentionNode],
};
