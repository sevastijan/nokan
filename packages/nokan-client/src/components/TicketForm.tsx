/**
 * TicketForm - Form component for creating new tickets
 */
import React, { useState, useEffect } from 'react';
import type { NokanClient } from '../client';
import type { ApiTokenInfo, CreateTicketInput } from '../types';

export interface TicketFormProps {
    client: NokanClient;
    onSuccess?: (ticket: { id: string; title: string }) => void;
    onError?: (error: Error) => void;
    className?: string;
}

export interface TicketFormStyles {
    form?: React.CSSProperties;
    fieldGroup?: React.CSSProperties;
    label?: React.CSSProperties;
    input?: React.CSSProperties;
    textarea?: React.CSSProperties;
    select?: React.CSSProperties;
    button?: React.CSSProperties;
    buttonDisabled?: React.CSSProperties;
    error?: React.CSSProperties;
    success?: React.CSSProperties;
}

const defaultStyles: TicketFormStyles = {
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '500px',
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    label: {
        fontSize: '14px',
        fontWeight: 500,
        color: '#374151',
    },
    input: {
        padding: '8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
    },
    textarea: {
        padding: '8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
        minHeight: '100px',
        resize: 'vertical' as const,
    },
    select: {
        padding: '8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
        backgroundColor: 'white',
    },
    button: {
        padding: '10px 20px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
    },
    buttonDisabled: {
        backgroundColor: '#9ca3af',
        cursor: 'not-allowed',
    },
    error: {
        padding: '12px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '6px',
        color: '#dc2626',
        fontSize: '14px',
    },
    success: {
        padding: '12px',
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '6px',
        color: '#16a34a',
        fontSize: '14px',
    },
};

export function TicketForm({ client, onSuccess, onError, className }: TicketFormProps) {
    const [boardInfo, setBoardInfo] = useState<ApiTokenInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [columnId, setColumnId] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

    useEffect(() => {
        async function loadBoardInfo() {
            try {
                const info = await client.connect();
                setBoardInfo(info);
                if (info.columns.length > 0) {
                    setColumnId(info.columns[0].id);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to connect');
            } finally {
                setLoading(false);
            }
        }
        loadBoardInfo();
    }, [client]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setSubmitting(true);

        try {
            const input: CreateTicketInput = {
                title: title.trim(),
                column_id: columnId,
                description: description.trim() || undefined,
                priority,
            };

            const ticket = await client.createTicket(input);
            setSuccess(`Ticket "${ticket.title}" created successfully!`);
            setTitle('');
            setDescription('');
            setPriority('medium');
            onSuccess?.(ticket);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to create ticket';
            setError(errorMsg);
            onError?.(err instanceof Error ? err : new Error(errorMsg));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!boardInfo) {
        return <div style={defaultStyles.error}>{error || 'Failed to load board info'}</div>;
    }

    if (!boardInfo.permissions.write) {
        return <div style={defaultStyles.error}>You don&apos;t have permission to create tickets</div>;
    }

    return (
        <form onSubmit={handleSubmit} style={defaultStyles.form} className={className}>
            {error && <div style={defaultStyles.error}>{error}</div>}
            {success && <div style={defaultStyles.success}>{success}</div>}

            <div style={defaultStyles.fieldGroup}>
                <label style={defaultStyles.label}>Title *</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Enter ticket title"
                    style={defaultStyles.input}
                />
            </div>

            <div style={defaultStyles.fieldGroup}>
                <label style={defaultStyles.label}>Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue..."
                    style={defaultStyles.textarea}
                />
            </div>

            <div style={defaultStyles.fieldGroup}>
                <label style={defaultStyles.label}>Column *</label>
                <select
                    value={columnId}
                    onChange={(e) => setColumnId(e.target.value)}
                    required
                    style={defaultStyles.select}
                >
                    {boardInfo.columns.map((col) => (
                        <option key={col.id} value={col.id}>
                            {col.title}
                        </option>
                    ))}
                </select>
            </div>

            <div style={defaultStyles.fieldGroup}>
                <label style={defaultStyles.label}>Priority</label>
                <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as typeof priority)}
                    style={defaultStyles.select}
                >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                </select>
            </div>

            <button
                type="submit"
                disabled={submitting || !title.trim()}
                style={{
                    ...defaultStyles.button,
                    ...(submitting || !title.trim() ? defaultStyles.buttonDisabled : {}),
                }}
            >
                {submitting ? 'Creating...' : 'Create Ticket'}
            </button>
        </form>
    );
}
