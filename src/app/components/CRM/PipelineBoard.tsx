'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useGetCrmDealsQuery, useUpdateCrmDealMutation } from '@/app/store/apiSlice';
import type { CrmDeal, CrmDealStage } from '@/app/types/crmTypes';
import { STAGE_ORDER, STAGE_LABELS } from '@/app/types/crmTypes';
import DealCard from './DealCard';
import DealForm from './DealForm';
import DealWonModal from './DealWonModal';

// ---------------------------------------------------------------------------
// Value formatter
// ---------------------------------------------------------------------------

const formatValue = (value: number): string =>
  new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(value);

// ---------------------------------------------------------------------------
// Stage border colors (hex for inline styles)
// ---------------------------------------------------------------------------

const STAGE_HEADER_COLORS: Record<CrmDealStage, string> = {
  lead: '#64748b',
  qualification: '#3b82f6',
  proposal: '#f59e0b',
  negotiation: '#a855f7',
  won: '#10b981',
  lost: '#ef4444',
};

// ---------------------------------------------------------------------------
// SortableDealCard — wraps DealCard with useSortable
// ---------------------------------------------------------------------------

interface SortableDealCardProps {
  deal: CrmDeal;
}

const SortableDealCard = ({ deal }: SortableDealCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
    data: { type: 'deal', deal },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealCard deal={deal} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// DroppableColumn — makes the column a droppable area for empty columns
// ---------------------------------------------------------------------------

interface DroppableColumnProps {
  stage: CrmDealStage;
  isOver: boolean;
  children: React.ReactNode;
}

const DroppableColumn = ({ stage, isOver, children }: DroppableColumnProps) => {
  const { setNodeRef } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      data-stage={stage}
      className={`flex-1 p-2 space-y-2 transition-colors min-h-[120px] ${
        isOver ? 'bg-slate-700/20' : 'bg-transparent'
      }`}
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// PipelineBoard
// ---------------------------------------------------------------------------

const PipelineBoard = () => {
  const { t } = useTranslation();
  const { data: deals = [], isLoading } = useGetCrmDealsQuery();
  const [updateDeal] = useUpdateCrmDealMutation();

  // Modal state
  const [showDealForm, setShowDealForm] = useState(false);
  const [dealWonTarget, setDealWonTarget] = useState<CrmDeal | null>(null);

  // DnD state
  const [activeDeal, setActiveDeal] = useState<CrmDeal | null>(null);
  const [overStage, setOverStage] = useState<CrmDealStage | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Group deals by stage
  const dealsByStage = useMemo(() => {
    const grouped: Record<CrmDealStage, CrmDeal[]> = {
      lead: [],
      qualification: [],
      proposal: [],
      negotiation: [],
      won: [],
      lost: [],
    };
    deals.forEach((deal) => {
      if (grouped[deal.stage]) {
        grouped[deal.stage].push(deal);
      }
    });
    return grouped;
  }, [deals]);

  // Column totals
  const stageTotals = useMemo(() => {
    const totals: Record<CrmDealStage, number> = {
      lead: 0,
      qualification: 0,
      proposal: 0,
      negotiation: 0,
      won: 0,
      lost: 0,
    };
    deals.forEach((deal) => {
      if (totals[deal.stage] !== undefined) {
        totals[deal.stage] += deal.value;
      }
    });
    return totals;
  }, [deals]);

  // ---------------------------------------------------------------------------
  // Drag handlers
  // ---------------------------------------------------------------------------

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const deal = deals.find((d) => d.id === event.active.id);
      if (deal) setActiveDeal(deal);
    },
    [deals],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event;
      if (!over) {
        setOverStage(null);
        return;
      }

      // "over" can be a droppable stage column or another deal card
      const overId = over.id as string;

      // Check if overId is a stage column id
      if (STAGE_ORDER.includes(overId as CrmDealStage)) {
        setOverStage(overId as CrmDealStage);
        return;
      }

      // Otherwise it's a deal card — find which stage it belongs to
      const overDeal = deals.find((d) => d.id === overId);
      if (overDeal) {
        setOverStage(overDeal.stage);
      }
    },
    [deals],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDeal(null);
      setOverStage(null);

      if (!over) return;

      const dealId = active.id as string;
      const overId = over.id as string;

      // Determine target stage
      let targetStage: CrmDealStage | null = null;

      if (STAGE_ORDER.includes(overId as CrmDealStage)) {
        targetStage = overId as CrmDealStage;
      } else {
        const overDeal = deals.find((d) => d.id === overId);
        if (overDeal) targetStage = overDeal.stage;
      }

      if (!targetStage) return;

      const sourceDeal = deals.find((d) => d.id === dealId);
      if (!sourceDeal || sourceDeal.stage === targetStage) return;

      try {
        await updateDeal({ id: dealId, data: { stage: targetStage } }).unwrap();

        // If dropped on "won", open the won modal
        if (targetStage === 'won') {
          setDealWonTarget({ ...sourceDeal, stage: 'won' });
        }
      } catch (err) {
        console.error('PipelineBoard: stage update failed', err);
      }
    },
    [deals, updateDeal],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-semibold text-white">{t('crm.pipeline')}</h1>
        <button
          onClick={() => setShowDealForm(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          {t('crm.newDeal')}
        </button>
      </div>

      {/* Kanban */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {STAGE_ORDER.map((stage) => {
            const stageDeals = dealsByStage[stage];
            const dealIds = stageDeals.map((d) => d.id);
            const isOver = overStage === stage;

            return (
              <div
                key={stage}
                className="flex-shrink-0 w-[280px] flex flex-col border border-slate-700/50 rounded-lg overflow-hidden"
              >
                {/* Column header */}
                <div className="flex items-center gap-2 px-3 py-3 bg-slate-800/60 border-b border-slate-700/50">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: STAGE_HEADER_COLORS[stage] }}
                  />
                  <span className="text-sm font-semibold text-white">
                    {STAGE_LABELS[stage]}
                  </span>
                  <span className="text-xs font-medium text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded">
                    {stageDeals.length}
                  </span>
                  <span className="ml-auto text-xs text-slate-500">
                    {formatValue(stageTotals[stage])} PLN
                  </span>
                </div>

                {/* Column body — droppable */}
                <SortableContext
                  id={stage}
                  items={dealIds}
                  strategy={verticalListSortingStrategy}
                >
                  <DroppableColumn stage={stage} isOver={isOver}>
                    {stageDeals.length === 0 && !isOver && (
                      <div className="flex items-center justify-center h-20 text-xs text-slate-500">
                        {t('crm.noDeals')}
                      </div>
                    )}

                    {stageDeals.map((deal) => (
                      <SortableDealCard key={deal.id} deal={deal} />
                    ))}

                    {/* Drop indicator when dragging over empty column */}
                    {isOver && stageDeals.length === 0 && (
                      <div className="h-16 rounded-lg border-2 border-dashed border-slate-600/50" />
                    )}
                  </DroppableColumn>
                </SortableContext>
              </div>
            );
          })}
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeDeal ? <DealCard deal={activeDeal} isDragOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {/* Modals */}
      <DealForm
        isOpen={showDealForm}
        onClose={() => setShowDealForm(false)}
      />

      {dealWonTarget && (
        <DealWonModal
          isOpen={!!dealWonTarget}
          onClose={() => setDealWonTarget(null)}
          deal={dealWonTarget}
        />
      )}
    </>
  );
};

export default PipelineBoard;
