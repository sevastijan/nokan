const SkeletonPulse = ({ className }: { className: string }) => (
     <div className={`bg-slate-700/60 rounded-lg animate-pulse ${className}`} />
);

const TaskViewSkeleton = () => {
     return (
          <div className="bg-gradient-to-b from-slate-800 to-slate-850 rounded-2xl w-full max-w-lg md:max-w-3xl lg:max-w-6xl max-h-[95vh] flex flex-col shadow-2xl shadow-black/40 border border-slate-700/50 overflow-hidden">
               {/* Header Skeleton */}
               <div className="relative px-6 py-5 border-b border-slate-700/50">
                    <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                              <SkeletonPulse className="w-24 h-6 rounded-full" />
                         </div>
                         <div className="flex gap-2">
                              <SkeletonPulse className="w-9 h-9" />
                              <SkeletonPulse className="w-9 h-9" />
                         </div>
                    </div>
                    <SkeletonPulse className="w-2/3 h-8" />
               </div>

               <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
                         {/* Properties Section Skeleton */}
                         <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
                              <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-700/30">
                                   <SkeletonPulse className="w-1 h-4 rounded-full" />
                                   <SkeletonPulse className="w-20 h-3" />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                   {[1, 2, 3].map((i) => (
                                        <div key={i} className="space-y-2">
                                             <SkeletonPulse className="w-16 h-3" />
                                             <SkeletonPulse className="w-full h-11" />
                                        </div>
                                   ))}
                              </div>
                         </div>

                         {/* Type & Status Skeleton */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {[1, 2].map((i) => (
                                   <div key={i} className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
                                        <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-700/30">
                                             <SkeletonPulse className="w-1 h-4 rounded-full" />
                                             <SkeletonPulse className="w-12 h-3" />
                                        </div>
                                        <SkeletonPulse className="w-full h-11" />
                                   </div>
                              ))}
                         </div>

                         {/* Description Skeleton */}
                         <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
                              <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-700/30">
                                   <SkeletonPulse className="w-1 h-4 rounded-full" />
                                   <SkeletonPulse className="w-12 h-3" />
                              </div>
                              <SkeletonPulse className="w-full h-32" />
                         </div>

                         {/* Dates Skeleton */}
                         <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
                              <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-700/30">
                                   <SkeletonPulse className="w-1 h-4 rounded-full" />
                                   <SkeletonPulse className="w-16 h-3" />
                              </div>
                              <div className="flex gap-4">
                                   <div className="flex-1 space-y-2">
                                        <SkeletonPulse className="w-24 h-4" />
                                        <SkeletonPulse className="w-full h-11" />
                                   </div>
                                   <div className="flex-1 space-y-2">
                                        <SkeletonPulse className="w-24 h-4" />
                                        <SkeletonPulse className="w-full h-11" />
                                   </div>
                              </div>
                         </div>
                    </div>

                    {/* Sidebar Skeleton */}
                    <div className="hidden md:block w-72 lg:w-80 bg-gradient-to-b from-slate-800/80 to-slate-900/80 border-l border-slate-700/30 flex-shrink-0">
                         <div className="px-5 py-4 border-b border-slate-700/30">
                              <SkeletonPulse className="w-20 h-4" />
                         </div>
                         <div className="p-4 space-y-4">
                              {[1, 2, 3, 4].map((i) => (
                                   <div key={i} className="space-y-2">
                                        <SkeletonPulse className="w-16 h-3" />
                                        <SkeletonPulse className="w-full h-12" />
                                   </div>
                              ))}
                         </div>
                    </div>
               </div>

               {/* Footer Skeleton */}
               <div className="relative px-6 py-4 border-t border-slate-700/30">
                    <div className="flex items-center justify-between">
                         <SkeletonPulse className="w-20 h-10" />
                         <div className="flex gap-3">
                              <SkeletonPulse className="w-24 h-10" />
                              <SkeletonPulse className="w-32 h-10" />
                         </div>
                    </div>
               </div>
          </div>
     );
};

export default TaskViewSkeleton;
