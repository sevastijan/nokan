/**
 * TicketList - Component for listing and filtering tickets
 */
import React, { useState, useEffect, useCallback } from 'react';
import type { NokanClient } from '../client';
import type { Ticket, ApiTokenInfo } from '../types';

export interface TicketListProps {
    client: NokanClient;
    onTicketClick?: (ticketId: string) => void;
    className?: string;
}

const styles = {
    container: {
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
    } as React.CSSProperties,
    header: {
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap' as const,
    } as React.CSSProperties,
    title: {
        fontSize: '16px',
        fontWeight: 600,
        color: '#111827',
        margin: 0,
    } as React.CSSProperties,
    filters: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
    } as React.CSSProperties,
    select: {
        padding: '6px 10px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '13px',
        backgroundColor: 'white',
    } as React.CSSProperties,
    list: {
        listStyle: 'none',
        margin: 0,
        padding: 0,
    } as React.CSSProperties,
    item: {
        padding: '12px 20px',
        borderBottom: '1px solid #e5e7eb',
        cursor: 'pointer',
        transition: 'background-color 0.15s',
    } as React.CSSProperties,
    itemTitle: {
        fontSize: '14px',
        fontWeight: 500,
        color: '#111827',
        marginBottom: '4px',
    } as React.CSSProperties,
    itemMeta: {
        display: 'flex',
        gap: '8px',
        fontSize: '12px',
        color: '#6b7280',
    } as React.CSSProperties,
    badge: {
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 500,
    } as React.CSSProperties,
    pagination: {
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #e5e7eb',
        fontSize: '13px',
        color: '#6b7280',
    } as React.CSSProperties,
    pageButton: {
        padding: '6px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        backgroundColor: 'white',
        cursor: 'pointer',
        fontSize: '13px',
    } as React.CSSProperties,
    empty: {
        padding: '40px 20px',
        textAlign: 'center' as const,
        color: '#6b7280',
    } as React.CSSProperties,
    loading: {
        padding: '40px',
        textAlign: 'center' as const,
        color: '#6b7280',
    } as React.CSSProperties,
    error: {
        padding: '12px 20px',
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        fontSize: '14px',
    } as React.CSSProperties,
};

// Helper to get priority style from API priorities or use fallback
function getPriorityStyle(
    priorityId: string,
    priorities: Array<{ id: string; label: string; color: string }>
): { bg: string; text: string; label: string } {
    const priority = priorities.find(p => p.id === priorityId);
    if (priority) {
        // Use the color from API with lighter background
        return {
            bg: priority.color + '20', // Add transparency for background
            text: priority.color,
            label: priority.label,
        };
    }
    // Fallback for unknown priorities
    return { bg: '#e5e7eb', text: '#374151', label: priorityId };
}

export function TicketList({ client, onTicketClick, className }: TicketListProps) {
    const [boardInfo, setBoardInfo] = useState<ApiTokenInfo | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [columnFilter, setColumnFilter] = useState<string>('');

    const loadTickets = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let info = boardInfo;
            if (!info) {
                info = await client.connect();
                setBoardInfo(info);
            }

            const response = await client.listTickets({
                page,
                limit: 20,
                column_id: columnFilter || undefined,
            });

            setTickets(response.data);
            setTotalPages(response.meta.pagination.total_pages);
            setTotal(response.meta.pagination.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load tickets');
        } finally {
            setLoading(false);
        }
    }, [client, boardInfo, page, columnFilter]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    const handleColumnChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setColumnFilter(e.target.value);
        setPage(1);
    };

    if (loading && tickets.length === 0) {
        return <div style={styles.loading}>Loading tickets...</div>;
    }

    return (
        <div style={styles.container} className={className}>
            <div style={styles.header}>
                <h3 style={styles.title}>Tickets ({total})</h3>
                <div style={styles.filters}>
                    {boardInfo && boardInfo.columns.length > 0 && (
                        <select
                            value={columnFilter}
                            onChange={handleColumnChange}
                            style={styles.select}
                        >
                            <option value="">All columns</option>
                            {boardInfo.columns.map((col) => (
                                <option key={col.id} value={col.id}>
                                    {col.title}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            {tickets.length === 0 ? (
                <div style={styles.empty}>No tickets found</div>
            ) : (
                <ul style={styles.list}>
                    {tickets.map((ticket) => {
                        const priorityStyle = getPriorityStyle(ticket.priority, boardInfo?.priorities || []);
                        return (
                            <li
                                key={ticket.id}
                                style={styles.item}
                                onClick={() => onTicketClick?.(ticket.id)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f9fafb';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white';
                                }}
                            >
                                <div style={styles.itemTitle}>{ticket.title}</div>
                                <div style={styles.itemMeta}>
                                    <span
                                        style={{
                                            ...styles.badge,
                                            backgroundColor: priorityStyle.bg,
                                            color: priorityStyle.text,
                                        }}
                                    >
                                        {priorityStyle.label}
                                    </span>
                                    {ticket.column && (
                                        <span>{ticket.column.title}</span>
                                    )}
                                    {ticket.completed && (
                                        <span style={{ color: '#059669' }}>✓ Completed</span>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {totalPages > 1 && (
                <div style={styles.pagination}>
                    <button
                        style={{
                            ...styles.pageButton,
                            opacity: page <= 1 ? 0.5 : 1,
                            cursor: page <= 1 ? 'not-allowed' : 'pointer',
                        }}
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        ← Previous
                    </button>
                    <span>
                        Page {page} of {totalPages}
                    </span>
                    <button
                        style={{
                            ...styles.pageButton,
                            opacity: page >= totalPages ? 0.5 : 1,
                            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                        }}
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
