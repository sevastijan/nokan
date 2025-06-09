export interface SearchAndFiltersProps {
    onSearch?: (query: string) => void;
    onFilterChange?: (filters: FilterState) => void;
  }
  
  export interface FilterState {
    assignee: string;
    priority: string;
    dueDate: string;
  }