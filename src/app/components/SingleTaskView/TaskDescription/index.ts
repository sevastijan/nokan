// Main component
export { default } from './TaskDescription';

// Nodes
export { ImageNode, $createImageNode, $isImageNode } from './nodes/ImageNode';
export type { SerializedImageNode } from './nodes/ImageNode';

// Config
export { editorConfig } from './config/editorConfig';

// Utils
export { uploadImage, insertImageIntoEditor } from './utils/imageUpload';
export type { ImageUploadResult } from './utils/imageUpload';

// Plugins
export { ToolbarPlugin } from './plugins/ToolbarPlugin';
export { PasteImagePlugin } from './plugins/PasteImagePlugin';
export { LoadContentPlugin } from './plugins/LoadContentPlugin';
export { SmartEnterPlugin, SmartPastePlugin } from './plugins/SmartPlugins';
