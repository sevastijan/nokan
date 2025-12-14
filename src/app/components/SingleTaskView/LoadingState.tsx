interface LoadingStateProps {
     message: string;
     isError?: boolean;
}

export const LoadingState = ({ message, isError = false }: LoadingStateProps) => {
     return (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
               <div className={`p-4 bg-slate-800 rounded-lg border border-slate-600 ${isError ? 'text-red-400' : 'text-white'}`}>{message}</div>
          </div>
     );
};
