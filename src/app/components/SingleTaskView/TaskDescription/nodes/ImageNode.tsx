import { DecoratorNode, LexicalNode, SerializedLexicalNode, Spread } from 'lexical';

export type SerializedImageNode = Spread<
     {
          src: string;
          altText: string;
          type: 'image';
          version: 1;
     },
     SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
     __src: string;
     __altText: string;

     static getType(): string {
          return 'image';
     }

     static clone(node: ImageNode): ImageNode {
          return new ImageNode(node.__src, node.__altText, node.__key);
     }

     constructor(src: string, altText: string, key?: string) {
          super(key);
          this.__src = src;
          this.__altText = altText;
     }

     createDOM(): HTMLElement {
          const div = document.createElement('div');
          div.style.display = 'contents';
          return div;
     }

     updateDOM(): false {
          return false;
     }

     decorate(): JSX.Element {
          return (
               // eslint-disable-next-line @next/next/no-img-element
               <img
                    src={this.__src}
                    alt={this.__altText}
                    style={{
                         maxWidth: '300px',
                         maxHeight: '200px',
                         width: 'auto',
                         height: 'auto',
                         objectFit: 'cover',
                         borderRadius: '8px',
                         margin: '8px 0',
                         display: 'block',
                         cursor: 'pointer',
                    }}
                    onClick={(e) => {
                         e.preventDefault();
                         const event = new CustomEvent('lexical-image-click', {
                              detail: { src: this.__src },
                              bubbles: true,
                         });
                         e.target.dispatchEvent(event);
                    }}
               />
          );
     }

     exportJSON(): SerializedImageNode {
          return {
               src: this.__src,
               altText: this.__altText,
               type: 'image',
               version: 1,
          };
     }

     static importJSON(serializedNode: SerializedImageNode): ImageNode {
          return $createImageNode(serializedNode.src, serializedNode.altText);
     }

     exportDOM() {
          const element = document.createElement('img');
          element.setAttribute('src', this.__src);
          element.setAttribute('alt', this.__altText);
          element.setAttribute('style', 'max-width: 300px; max-height: 200px; width: auto; height: auto; object-fit: cover; border-radius: 8px; margin: 8px 0; cursor: pointer;');
          return { element };
     }

     static importDOM() {
          return {
               img: () => ({
                    conversion: (element: HTMLElement) => {
                         const img = element as HTMLImageElement;
                         const src = img.getAttribute('src') || img.src;
                         const alt = img.getAttribute('alt') || img.alt || 'image';

                         if (!src) {
                              return { node: null };
                         }

                         return {
                              node: $createImageNode(src, alt),
                         };
                    },
                    priority: 1 as const,
               }),
          };
     }
}

export function $createImageNode(src: string, altText: string): ImageNode {
     return new ImageNode(src, altText);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
     return node instanceof ImageNode;
}
