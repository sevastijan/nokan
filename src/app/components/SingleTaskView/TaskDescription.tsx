'use client';

interface TaskDescriptionProps {
     value: string;
     onChange: (value: string) => void;
}

const TaskDescription = ({ value, onChange }: TaskDescriptionProps) => {
     return (
          <div>
               <span className="block text-sm font-medium text-slate-300 mb-2">Opis</span>
               <textarea
                    className="mt-1 w-full p-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Opisz zadanie..."
                    rows={4}
               />
          </div>
     );
};

export default TaskDescription;
