import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { Popover, Transition } from '@headlessui/react';
import Button from '@/app/components/Button/Button';
import { FilterPopover } from './FilterPopover';

interface DashboardToolbarProps {
     searchTerm: string;
     onSearchChange: (value: string) => void;
     hasTasksOnly: boolean;
     setHasTasksOnly: (value: boolean) => void;
     hasMembersOnly: boolean;
     setHasMembersOnly: (value: boolean) => void;
     onClearFilters: () => void;
     onCreateClick: () => void;
}

export const DashboardToolbar = ({
     searchTerm,
     onSearchChange,
     hasTasksOnly,
     setHasTasksOnly,
     hasMembersOnly,
     setHasMembersOnly,
     onClearFilters,
     onCreateClick,
}: DashboardToolbarProps) => {
     return (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
               <div>
                    <h2 className="text-2xl font-bold text-white">Your Boards</h2>
                    <p className="text-slate-400 text-sm">Manage and organize your projects</p>
               </div>

               <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-60">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                         <input
                              type="text"
                              placeholder="Search boards..."
                              value={searchTerm}
                              onChange={(e) => onSearchChange(e.target.value)}
                              className="pl-9 pr-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-sm text-slate-200 w-full placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition"
                         />
                    </div>

                    <Popover className="relative">
                         {({ open }) => (
                              <>
                                   <Popover.Button
                                        className={`flex items-center gap-2 px-3.5 py-2 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 text-sm rounded-lg border transition cursor-pointer ${
                                             open ? 'border-blue-500/50 ring-1 ring-blue-500/50' : 'border-slate-700/50'
                                        }`}
                                   >
                                        <SlidersHorizontal className="w-4 h-4" />
                                        Filter
                                   </Popover.Button>
                                   <Transition
                                        show={open}
                                        as="div"
                                        enter="transition ease-out duration-150"
                                        enterFrom="opacity-0 translate-y-1"
                                        enterTo="opacity-100 translate-y-0"
                                        leave="transition ease-in duration-100"
                                        leaveFrom="opacity-100 translate-y-0"
                                        leaveTo="opacity-0 translate-y-1"
                                   >
                                        <Popover.Panel className="absolute right-0 z-40 mt-2">
                                             <FilterPopover
                                                  hasTasksOnly={hasTasksOnly}
                                                  setHasTasksOnly={setHasTasksOnly}
                                                  hasMembersOnly={hasMembersOnly}
                                                  setHasMembersOnly={setHasMembersOnly}
                                                  clearFilters={onClearFilters}
                                             />
                                        </Popover.Panel>
                                   </Transition>
                              </>
                         )}
                    </Popover>

                    <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={onCreateClick} className="w-full sm:w-auto">
                         New Board
                    </Button>
               </div>
          </div>
     );
};
