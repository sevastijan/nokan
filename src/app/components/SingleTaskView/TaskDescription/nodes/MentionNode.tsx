import { DecoratorNode, LexicalNode, SerializedLexicalNode, Spread } from 'lexical';

export type SerializedMentionNode = Spread<
     {
          mentionName: string;
          type: 'mention';
          version: 1;
     },
     SerializedLexicalNode
>;

export class MentionNode extends DecoratorNode<JSX.Element> {
     __name: string;

     static getType(): string {
          return 'mention';
     }

     static clone(node: MentionNode): MentionNode {
          return new MentionNode(node.__name, node.__key);
     }

     constructor(name: string, key?: string) {
          super(key);
          this.__name = name;
     }

     createDOM(): HTMLElement {
          const span = document.createElement('span');
          span.style.display = 'inline';
          return span;
     }

     updateDOM(): false {
          return false;
     }

     isInline(): boolean {
          return true;
     }

     getTextContent(): string {
          return `@{${this.__name}}`;
     }

     decorate(): JSX.Element {
          return (
               <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md bg-blue-500/20 text-blue-300 text-sm font-medium select-none"
                    contentEditable={false}
                    data-mention={this.__name}
               >
                    <span className="text-blue-400/70">@</span>
                    {this.__name}
               </span>
          );
     }

     exportJSON(): SerializedMentionNode {
          return {
               mentionName: this.__name,
               type: 'mention',
               version: 1,
          };
     }

     static importJSON(serializedNode: SerializedMentionNode): MentionNode {
          return $createMentionNode(serializedNode.mentionName);
     }

     exportDOM() {
          const element = document.createElement('span');
          element.setAttribute('data-mention', this.__name);
          element.style.cssText =
               'display: inline-flex; align-items: center; gap: 2px; padding: 1px 6px; margin: 0 2px; border-radius: 6px; background: rgba(59,130,246,0.2); color: #93c5fd; font-size: 0.875rem; font-weight: 500;';
          element.textContent = `@{${this.__name}}`;
          return { element };
     }

     static importDOM() {
          return {
               span: (domNode: HTMLElement) => {
                    if (!domNode.hasAttribute('data-mention')) {
                         return null;
                    }
                    return {
                         conversion: (element: HTMLElement) => {
                              const name = element.getAttribute('data-mention') || '';
                              if (!name) return { node: null };
                              return { node: $createMentionNode(name) };
                         },
                         priority: 1 as const,
                    };
               },
          };
     }
}

export function $createMentionNode(name: string): MentionNode {
     return new MentionNode(name);
}

export function $isMentionNode(node: LexicalNode | null | undefined): node is MentionNode {
     return node instanceof MentionNode;
}
