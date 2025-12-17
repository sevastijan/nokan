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
    /** Hide column selector (will use first column as default) */
    hideColumn?: boolean;
    /** Hide priority selector */
    hidePriority?: boolean;
    /** Default priority label */
    defaultPriority?: string;
    /** Show attachment upload field */
    showAttachment?: boolean;
    /** Hide attachment field */
    hideAttachment?: boolean;
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
    fileInput?: React.CSSProperties;
    fileButton?: React.CSSProperties;
    fileList?: React.CSSProperties;
    fileItem?: React.CSSProperties;
    removeButton?: React.CSSProperties;
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
    fileInput: {
        display: 'none',
    },
    fileButton: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: '#f3f4f6',
        color: '#374151',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
        cursor: 'pointer',
    },
    fileList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
        marginTop: '8px',
    },
    fileItem: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        backgroundColor: '#f9fafb',
        borderRadius: '6px',
        fontSize: '14px',
    },
    removeButton: {
        background: 'none',
        border: 'none',
        color: '#dc2626',
        cursor: 'pointer',
        fontSize: '16px',
        padding: '0 4px',
    },
};

export function TicketForm({
    client,
    onSuccess,
    onError,
    className,
    hideColumn = false,
    hidePriority = false,
    defaultPriority,
    showAttachment = false,
    hideAttachment = false,
}: TicketFormProps) {
    const [boardInfo, setBoardInfo] = useState<ApiTokenInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [columnId, setColumnId] = useState('');
    const [priority, setPriority] = useState<string>('');
    const [attachments, setAttachments] = useState<File[]>([]);

    useEffect(() => {
        async function loadBoardInfo() {
            try {
                const info = await client.connect();
                setBoardInfo(info);
                if (info.columns.length > 0) {
                    setColumnId(info.columns[0].id);
                }
                // Set default priority from API priorities
                if (defaultPriority) {
                    setPriority(defaultPriority);
                } else if (info.priorities.length > 0) {
                    // Try to find "medium" or "normal" as default, otherwise use first
                    const mediumPriority = info.priorities.find(
                        p => p.label.toLowerCase() === 'medium' || p.label.toLowerCase() === 'normal'
                    );
                    setPriority(mediumPriority?.label || info.priorities[0].label);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to connect');
            } finally {
                setLoading(false);
            }
        }
        loadBoardInfo();
    }, [client, defaultPriority]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setSubmitting(true);

        try {
            const input: CreateTicketInput = {
                title: title.trim(),
                description: description.trim() || undefined,
            };

            // Only include column_id if not hidden and selected
            if (!hideColumn && columnId) {
                input.column_id = columnId;
            }

            // Only include priority if not hidden and selected
            if (!hidePriority && priority) {
                input.priority = priority;
            }

            const ticket = await client.createTicket(input);

            // Upload attachments if any
            if (attachments.length > 0) {
                for (const file of attachments) {
                    try {
                        await client.addAttachment(ticket.id, file);
                    } catch (attachErr) {
                        console.error('Failed to upload attachment:', attachErr);
                        // Continue with other attachments even if one fails
                    }
                }
            }

            const attachmentInfo = attachments.length > 0
                ? ` with ${attachments.length} attachment(s)`
                : '';
            setSuccess(`Ticket "${ticket.title}" created successfully${attachmentInfo}!`);
            setTitle('');
            setDescription('');
            setAttachments([]);
            // Reset priority to default
            if (boardInfo?.priorities.length) {
                const mediumPriority = boardInfo.priorities.find(
                    p => p.label.toLowerCase() === 'medium' || p.label.toLowerCase() === 'normal'
                );
                setPriority(mediumPriority?.label || boardInfo.priorities[0].label);
            }
            onSuccess?.(ticket);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to create ticket';
            setError(errorMsg);
            onError?.(err instanceof Error ? err : new Error(errorMsg));
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            setAttachments(prev => [...prev, ...Array.from(files)]);
        }
        e.target.value = ''; // Reset to allow selecting same file again
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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

            {!hideColumn && boardInfo.columns.length > 0 && (
                <div style={defaultStyles.fieldGroup}>
                    <label style={defaultStyles.label}>Column</label>
                    <select
                        value={columnId}
                        onChange={(e) => setColumnId(e.target.value)}
                        style={defaultStyles.select}
                    >
                        {boardInfo.columns.map((col) => (
                            <option key={col.id} value={col.id}>
                                {col.title}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {!hidePriority && boardInfo.priorities.length > 0 && (
                <div style={defaultStyles.fieldGroup}>
                    <label style={defaultStyles.label}>Priority</label>
                    <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        style={defaultStyles.select}
                    >
                        {boardInfo.priorities.map((p) => (
                            <option key={p.id} value={p.label}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {(showAttachment || !hideAttachment) && (
                <div style={defaultStyles.fieldGroup}>
                    <label style={defaultStyles.label}>Attachments</label>
                    <input
                        type="file"
                        id="ticket-attachments"
                        multiple
                        onChange={handleFileSelect}
                        style={defaultStyles.fileInput}
                    />
                    <label htmlFor="ticket-attachments" style={defaultStyles.fileButton}>
                        + Add Files
                    </label>
                    {attachments.length > 0 && (
                        <div style={defaultStyles.fileList}>
                            {attachments.map((file, index) => (
                                <div key={index} style={defaultStyles.fileItem}>
                                    <span>{file.name} ({formatFileSize(file.size)})</span>
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(index)}
                                        style={defaultStyles.removeButton}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

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
