const TaskViewSkeleton = () => {
     return (
          <div className="bg-slate-800 rounded-xl w-full max-w-lg md:max-w-3xl lg:max-w-6xl max-h-[95vh] md:max-h-screen flex flex-col shadow-xl border border-slate-600 overflow-hidden">
               {/* Header Skeleton */}
               <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-700">
                    <div className="flex-1 min-w-0">
                         <div className="h-7 md:h-8 bg-slate-700 rounded-lg w-full max-w-sm animate-pulse"></div>
                    </div>
                    <div className="flex gap-2 ml-3 md:ml-4 flex-shrink-0">
                         <div className="w-7 h-7 md:w-8 md:h-8 bg-slate-700 rounded-lg animate-pulse"></div>
                         <div className="w-7 h-7 md:w-8 md:h-8 bg-slate-700 rounded-lg animate-pulse"></div>
                    </div>
               </div>

               <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
                         {/* Properties Grid Skeleton */}
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                              {[1, 2, 3].map((i) => (
                                   <div key={i} className="space-y-2">
                                        <div className="h-3 md:h-4 bg-slate-700 rounded w-1/3 animate-pulse"></div>
                                        <div className="h-9 md:h-10 bg-slate-700 rounded-lg animate-pulse"></div>
                                   </div>
                              ))}
                         </div>

                         {/* Description Skeleton */}
                         <div className="space-y-2">
                              <div className="h-3 md:h-4 bg-slate-700 rounded w-1/4 animate-pulse"></div>
                              <div className="h-24 md:h-32 bg-slate-700 rounded-lg animate-pulse"></div>
                         </div>

                         {/* Dates Skeleton */}
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                              {[1, 2].map((i) => (
                                   <div key={i} className="space-y-2">
                                        <div className="h-3 md:h-4 bg-slate-700 rounded w-1/3 animate-pulse"></div>
                                        <div className="h-9 md:h-10 bg-slate-700 rounded-lg animate-pulse"></div>
                                   </div>
                              ))}
                         </div>

                         {/* Attachments Skeleton */}
                         <div className="space-y-2">
                              <div className="h-3 md:h-4 bg-slate-700 rounded w-1/4 animate-pulse"></div>
                              <div className="h-20 md:h-24 bg-slate-700 rounded-lg animate-pulse"></div>
                         </div>

                         {/* Comments Skeleton - only visible on mobile/tablet */}
                         <div className="md:hidden space-y-3">
                              <div className="h-4 bg-slate-700 rounded w-1/3 animate-pulse"></div>
                              {[1, 2].map((i) => (
                                   <div key={i} className="flex gap-3">
                                        <div className="w-8 h-8 bg-slate-700 rounded-full animate-pulse flex-shrink-0"></div>
                                        <div className="flex-1 space-y-2">
                                             <div className="h-3 bg-slate-700 rounded w-1/4 animate-pulse"></div>
                                             <div className="h-16 bg-slate-700 rounded-lg animate-pulse"></div>
                                        </div>
                                   </div>
                              ))}
                         </div>
                    </div>

                    {/* Sidebar Skeleton - hidden on mobile */}
                    <div className="hidden md:block w-56 lg:w-64 border-l border-slate-700 p-4 lg:p-6 space-y-4 bg-slate-800/50 flex-shrink-0">
                         {[1, 2, 3, 4].map((i) => (
                              <div key={i} className="space-y-2">
                                   <div className="h-3 bg-slate-700 rounded w-1/2 animate-pulse"></div>
                                   <div className="h-5 lg:h-6 bg-slate-700 rounded animate-pulse"></div>
                              </div>
                         ))}
                    </div>
               </div>

               {/* Footer Skeleton */}
               <div className="flex items-center justify-between p-3 md:p-4 border-t border-slate-700 flex-shrink-0">
                    <div className="w-20 md:w-24 h-9 md:h-10 bg-slate-700 rounded-lg animate-pulse"></div>
                    <div className="flex gap-2">
                         <div className="w-16 md:w-20 h-9 md:h-10 bg-slate-700 rounded-lg animate-pulse"></div>
                         <div className="w-16 md:w-20 h-9 md:h-10 bg-slate-700 rounded-lg animate-pulse"></div>
                    </div>
               </div>
          </div>
     );
};

export default TaskViewSkeleton;
