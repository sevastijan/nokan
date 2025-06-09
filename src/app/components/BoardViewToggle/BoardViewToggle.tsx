import { FiGrid, FiList } from "react-icons/fi";

interface BoardViewToggleProps {
  viewMode: "columns" | "list";
  onViewChange: (mode: "columns" | "list") => void;
}

const BoardViewToggle = ({ viewMode, onViewChange }: BoardViewToggleProps) => {
  return (
    <div className="flex items-center bg-slate-700/50 rounded-lg p-1">
      <button
        onClick={() => onViewChange("columns")}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          viewMode === "columns"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-300 hover:text-white hover:bg-slate-600/50"
        }`}
      >
        <FiGrid className="w-4 h-4" />
        Columns
      </button>
      <button
        onClick={() => onViewChange("list")}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          viewMode === "list"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-300 hover:text-white hover:bg-slate-600/50"
        }`}
      >
        <FiList className="w-4 h-4" />
        List
      </button>
    </div>
  );
};

export default BoardViewToggle;
