/**
 * TicketView - Component for displaying ticket details with comments and attachments
 */
import React, { useState, useEffect, useCallback } from 'react';
import type { NokanClient } from '../client';
import type { TicketDetail, Comment, Attachment, ApiTokenInfo } from '../types';

export interface TicketViewProps {
    client: NokanClient;
    ticketId: string;
    onClose?: () => void;
    onUpdate?: (ticket: TicketDetail) => void;
    className?: string;
    /** Email to use as author for comments added via this component */
    authorEmail: string;
}

const styles = {
    container: {
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
    } as React.CSSProperties,
    header: {
        padding: '16px 20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px',
    } as React.CSSProperties,
    title: {
        fontSize: '18px',
        fontWeight: 600,
        color: '#111827',
        margin: 0,
    } as React.CSSProperties,
    closeButton: {
        background: 'none',
        border: 'none',
        fontSize: '20px',
        cursor: 'pointer',
        color: '#6b7280',
        padding: '4px',
    } as React.CSSProperties,
    body: {
        padding: '20px',
    } as React.CSSProperties,
    meta: {
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        flexWrap: 'wrap' as const,
    } as React.CSSProperties,
    badge: {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 500,
    } as React.CSSProperties,
    description: {
        color: '#374151',
        fontSize: '14px',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap' as const,
    } as React.CSSProperties,
    section: {
        marginTop: '24px',
        paddingTop: '24px',
        borderTop: '1px solid #e5e7eb',
    } as React.CSSProperties,
    sectionTitle: {
        fontSize: '14px',
        fontWeight: 600,
        color: '#374151',
        marginBottom: '12px',
    } as React.CSSProperties,
    comment: {
        padding: '12px',
        backgroundColor: '#f9fafb',
        borderRadius: '6px',
        marginBottom: '8px',
    } as React.CSSProperties,
    commentContent: {
        fontSize: '14px',
        color: '#374151',
        whiteSpace: 'pre-wrap' as const,
    } as React.CSSProperties,
    commentMeta: {
        fontSize: '12px',
        color: '#6b7280',
        marginTop: '8px',
    } as React.CSSProperties,
    attachment: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: '#f9fafb',
        borderRadius: '6px',
        marginBottom: '8px',
        fontSize: '14px',
        color: '#374151',
    } as React.CSSProperties,
    attachmentIcon: {
        fontSize: '16px',
    } as React.CSSProperties,
    attachmentSize: {
        fontSize: '12px',
        color: '#6b7280',
        marginLeft: 'auto',
    } as React.CSSProperties,
    form: {
        display: 'flex',
        gap: '8px',
        marginTop: '12px',
    } as React.CSSProperties,
    input: {
        flex: 1,
        padding: '8px 12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
    } as React.CSSProperties,
    button: {
        padding: '8px 16px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        cursor: 'pointer',
    } as React.CSSProperties,
    fileInput: {
        display: 'none',
    } as React.CSSProperties,
    fileButton: {
        padding: '8px 16px',
        backgroundColor: '#f3f4f6',
        color: '#374151',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
        cursor: 'pointer',
    } as React.CSSProperties,
    error: {
        padding: '12px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '6px',
        color: '#dc2626',
        fontSize: '14px',
    } as React.CSSProperties,
    loading: {
        padding: '40px',
        textAlign: 'center' as const,
        color: '#6b7280',
    } as React.CSSProperties,
};

// Helper to get priority style from API priorities or use fallback
function getPriorityStyle(
    priorityId: string,
    priorities: Array<{ id: string; label: string; color: string }>
): { bg: string; text: string; label: string } {
    const priority = priorities.find(p => p.id === priorityId);
    if (priority) {
        return {
            bg: priority.color + '20',
            text: priority.color,
            label: priority.label,
        };
    }
    return { bg: '#e5e7eb', text: '#374151', label: priorityId };
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString();
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function TicketView({ client, ticketId, onClose, onUpdate, className, authorEmail }: TicketViewProps) {
    const [ticket, setTicket] = useState<TicketDetail | null>(null);
    const [boardInfo, setBoardInfo] = useState<ApiTokenInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [permissions, setPermissions] = useState({ read: false, write: false, delete: false });

    const loadTicket = useCallback(async () => {
        try {
            const info = await client.connect();
            setBoardInfo(info);
            setPermissions(info.permissions);
            const data = await client.getTicket(ticketId);
            setTicket(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load ticket');
        } finally {
            setLoading(false);
        }
    }, [client, ticketId]);

    useEffect(() => {
        loadTicket();
    }, [loadTicket]);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmittingComment(true);
        try {
            const comment = await client.addComment(ticketId, { content: newComment.trim(), author_email: authorEmail });
            setTicket((prev) =>
                prev
                    ? {
                          ...prev,
                          comments: [...(prev.comments || []), comment],
                      }
                    : null
            );
            setNewComment('');
            if (ticket) onUpdate?.(ticket);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add comment');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingFile(true);
        try {
            const attachment = await client.addAttachment(ticketId, file);
            setTicket((prev) =>
                prev
                    ? {
                          ...prev,
                          attachments: [...(prev.attachments || []), attachment],
                      }
                    : null
            );
            if (ticket) onUpdate?.(ticket);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload attachment');
        } finally {
            setUploadingFile(false);
            e.target.value = '';
        }
    };

    if (loading) {
        return <div style={styles.loading}>Loading ticket...</div>;
    }

    if (error && !ticket) {
        return <div style={styles.error}>{error}</div>;
    }

    if (!ticket) {
        return <div style={styles.error}>Ticket not found</div>;
    }

    const priorityStyle = getPriorityStyle(ticket.priority, boardInfo?.priorities || []);

    return (
        <div style={styles.container} className={className}>
            <div style={styles.header}>
                <h2 style={styles.title}>{ticket.title}</h2>
                {onClose && (
                    <button style={styles.closeButton} onClick={onClose}>
                        ×
                    </button>
                )}
            </div>

            <div style={styles.body}>
                {error && <div style={{ ...styles.error, marginBottom: '16px' }}>{error}</div>}

                <div style={styles.meta}>
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
                        <span style={{ ...styles.badge, backgroundColor: '#e5e7eb', color: '#374151' }}>
                            {ticket.column.title}
                        </span>
                    )}
                    {ticket.status && (
                        <span
                            style={{
                                ...styles.badge,
                                backgroundColor: ticket.status.color + '20',
                                color: ticket.status.color,
                            }}
                        >
                            {ticket.status.label}
                        </span>
                    )}
                    {ticket.completed && (
                        <span style={{ ...styles.badge, backgroundColor: '#d1fae5', color: '#059669' }}>
                            Completed
                        </span>
                    )}
                </div>

                {ticket.description && <p style={styles.description}>{ticket.description}</p>}

                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '16px' }}>
                    Created: {formatDate(ticket.created_at)}
                    {ticket.updated_at !== ticket.created_at && (
                        <> · Updated: {formatDate(ticket.updated_at)}</>
                    )}
                </div>

                {/* Comments Section */}
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                        Comments ({ticket.comments?.length || 0})
                    </h3>

                    {ticket.comments?.map((comment: Comment) => (
                        <div key={comment.id} style={styles.comment}>
                            <div style={styles.commentContent}>{comment.content}</div>
                            <div style={styles.commentMeta}>
                                {comment.author?.name || 'Anonymous'} · {formatDate(comment.created_at)}
                            </div>
                        </div>
                    ))}

                    {ticket.comments?.length === 0 && (
                        <div style={{ color: '#6b7280', fontSize: '14px' }}>No comments yet</div>
                    )}

                    {permissions.write && (
                        <form onSubmit={handleAddComment} style={styles.form}>
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                style={styles.input}
                            />
                            <button
                                type="submit"
                                disabled={submittingComment || !newComment.trim()}
                                style={{
                                    ...styles.button,
                                    opacity: submittingComment || !newComment.trim() ? 0.5 : 1,
                                }}
                            >
                                {submittingComment ? '...' : 'Send'}
                            </button>
                        </form>
                    )}
                </div>

                {/* Attachments Section */}
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>
                        Attachments ({ticket.attachments?.length || 0})
                    </h3>

                    {ticket.attachments?.map((attachment: Attachment) => (
                        <div key={attachment.id} style={styles.attachment}>
                            <span style={styles.attachmentIcon}>📎</span>
                            <span>{attachment.file_name}</span>
                            <span style={styles.attachmentSize}>
                                {formatFileSize(attachment.file_size)}
                            </span>
                        </div>
                    ))}

                    {ticket.attachments?.length === 0 && (
                        <div style={{ color: '#6b7280', fontSize: '14px' }}>No attachments</div>
                    )}

                    {permissions.write && (
                        <div style={{ marginTop: '12px' }}>
                            <input
                                type="file"
                                id="file-upload"
                                onChange={handleFileUpload}
                                style={styles.fileInput}
                            />
                            <label htmlFor="file-upload" style={styles.fileButton}>
                                {uploadingFile ? 'Uploading...' : '+ Add Attachment'}
                            </label>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
