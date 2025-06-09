export interface BoardTemplate {
    id: string;
    name: string;
    description: string;
    is_custom: boolean;
    created_at?: string;
    updated_at?: string;
    columns: TemplateColumn[];
  }

export interface TemplateSelectorProps {
    selectedTemplate: BoardTemplate | null;
    onTemplateSelect: (template: BoardTemplate) => void;
    onCreateTemplate: () => void;
    disabled?: boolean;
    refreshTrigger?: number;
  }

  
  export interface TemplateColumn {
    id: string;
    template_id: string;
    title: string;
    order: number;
  }

export interface CreateTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTemplateCreated: () => void;
  }
  
  export const DEFAULT_TEMPLATES: Omit<BoardTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
    {
      name: 'Basic Kanban',
      description: 'Prosty układ trzech kolumn',
      is_custom: false,
      columns: [
        { id: 'temp-1', template_id: '', title: 'To Do', order: 0 },
        { id: 'temp-2', template_id: '', title: 'In Progress', order: 1 },
        { id: 'temp-3', template_id: '', title: 'Done', order: 2 },
      ],
    },
    {
      name: 'Development Workflow',
      description: 'Szablon dla zespołów deweloperskich',
      is_custom: false,
      columns: [
        { id: 'temp-4', template_id: '', title: 'Backlog', order: 0 },
        { id: 'temp-5', template_id: '', title: 'In Development', order: 1 },
        { id: 'temp-6', template_id: '', title: 'Code Review', order: 2 },
        { id: 'temp-7', template_id: '', title: 'Testing', order: 3 },
        { id: 'temp-8', template_id: '', title: 'Done', order: 4 },
      ],
    },
    {
      name: 'Marketing Campaign',
      description: 'Szablon dla kampanii marketingowych',
      is_custom: false,
      columns: [
        { id: 'temp-9', template_id: '', title: 'Ideas', order: 0 },
        { id: 'temp-10', template_id: '', title: 'Planning', order: 1 },
        { id: 'temp-11', template_id: '', title: 'In Progress', order: 2 },
        { id: 'temp-12', template_id: '', title: 'Review', order: 3 },
        { id: 'temp-13', template_id: '', title: 'Published', order: 4 },
      ],
    },
  ];