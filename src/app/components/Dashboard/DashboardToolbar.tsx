import { FaPlus, FaSearch, FaFilter, FaCalendarAlt } from 'react-icons/fa';
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
     onCalendarClick: () => void;
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
     onCalendarClick,
     onCreateClick,
}: DashboardToolbarProps) => {
     return (
          <div className="flex flex-col gap-6 sm:gap-0 sm:flex-row sm:justify-between sm:items-center mb-8">
               <div className="mb-1">
                    <h2 className="text-2xl font-bold text-white">Your Boards</h2>
                    <p className="text-slate-400 text-sm">Manage and organize your projects</p>
               </div>

               <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                         <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                         <input
                              type="text"
                              placeholder="Search boards..."
                              value={searchTerm}
                              onChange={(e) => onSearchChange(e.target.value)}
                              className="pl-10 pr-4 py-2 bg-slate-700/60 border border-slate-600/50 rounded-xl text-slate-200 w-full focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                         />
                    </div>

                    <Popover className="relative">
                         {({ open }) => (
                              <>
                                   <Popover.Button
                                        className={`flex items-center gap-2 px-4 py-2 bg-slate-700/70 hover:bg-slate-700/90 text-slate-200 rounded-lg transition ${
                                             open ? 'ring-2 ring-purple-500' : ''
                                        }`}
                                   >
                                        <FaFilter className="w-4 h-4" />
                                        <span className="text-sm">Filter</span>
                                   </Popover.Button>
                                   <Transition
                                        show={open}
                                        as="div"
                                        enter="transition ease-out duration-150"
                                        enterFrom="opacity-0 translate-y-2"
                                        enterTo="opacity-100 translate-y-0"
                                        leave="transition ease-in duration-100"
                                        leaveFrom="opacity-100 translate-y-0"
                                        leaveTo="opacity-0 translate-y-2"
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

                    <Button variant="secondary" size="md" icon={<FaCalendarAlt />} onClick={onCalendarClick} className="w-full sm:w-auto">
                         Calendar View
                    </Button>

                    <Button variant="primary" size="md" icon={<FaPlus />} onClick={onCreateClick} className="w-full sm:w-auto">
                         Create Board
                    </Button>
               </div>
          </div>
     );
};
