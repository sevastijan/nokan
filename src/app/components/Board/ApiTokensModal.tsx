'use client';

import { useState, useCallback } from 'react';
import { FiX, FiCopy, FiTrash2, FiPlus, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import {
    useGetApiTokensQuery,
    useCreateApiTokenMutation,
    useRevokeApiTokenMutation,
} from '@/app/store/apiSlice';
import type { BoardApiTokenListItem, ApiTokenPermissions } from '@/app/lib/public-api/types';

interface ApiTokensModalProps {
    isOpen: boolean;
    onClose: () => void;
    boardId: string;
}

interface NewTokenState {
    name: string;
    permissions: ApiTokenPermissions;
    expiresAt: string;
}

const defaultNewToken: NewTokenState = {
    name: '',
    permissions: { read: true, write: false, delete: false },
    expiresAt: '',
};

export default function ApiTokensModal({ isOpen, onClose, boardId }: ApiTokensModalProps) {
    const { data: tokens = [], isLoading, refetch } = useGetApiTokensQuery(boardId, { skip: !isOpen });
    const [createToken] = useCreateApiTokenMutation();
    const [revokeToken] = useRevokeApiTokenMutation();

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newToken, setNewToken] = useState<NewTokenState>(defaultNewToken);
    const [createdToken, setCreatedToken] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [revoking, setRevoking] = useState<string | null>(null);

    const handleCreate = useCallback(async () => {
        if (!newToken.name.trim()) {
            alert('Nazwa tokena jest wymagana');
            return;
        }

        setIsCreating(true);
        try {
            const result = await createToken({
                boardId,
                input: {
                    name: newToken.name.trim(),
                    permissions: newToken.permissions,
                    expires_at: newToken.expiresAt || null,
                },
            }).unwrap();

            setCreatedToken(result.token);
            setShowCreateForm(false);
            setNewToken(defaultNewToken);
            refetch();
        } catch (error) {
            console.error('Failed to create token:', error);
            alert('Nie udało się utworzyć tokena');
        } finally {
            setIsCreating(false);
        }
    }, [boardId, createToken, newToken, refetch]);

    const handleRevoke = useCallback(async (tokenId: string) => {
        if (!confirm('Czy na pewno chcesz unieważnić ten token? Ta operacja jest nieodwracalna.')) {
            return;
        }

        setRevoking(tokenId);
        try {
            await revokeToken({ boardId, tokenId }).unwrap();
            refetch();
        } catch (error) {
            console.error('Failed to revoke token:', error);
            alert('Nie udało się unieważnić tokena');
        } finally {
            setRevoking(null);
        }
    }, [boardId, revokeToken, refetch]);

    const copyToClipboard = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            alert('Nie udało się skopiować do schowka');
        }
    }, []);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Nigdy';
        return new Date(dateStr).toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const activeTokens = tokens.filter((t: BoardApiTokenListItem) => t.is_active);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-slate-800 text-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                        initial={{ scale: 0.8, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 50 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-700">
                            <h2 className="text-xl font-semibold">Integracje API</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <FiX size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Created token alert */}
                            {createdToken && (
                                <div className="mb-6 p-4 bg-amber-500/20 border border-amber-500 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <FiAlertTriangle className="text-amber-500 mt-0.5 flex-shrink-0" size={20} />
                                        <div className="flex-1">
                                            <p className="font-medium text-amber-500 mb-2">
                                                Token utworzony! Zapisz go teraz - nie będzie widoczny później.
                                            </p>
                                            <div className="flex items-center gap-2 bg-slate-900 p-3 rounded font-mono text-sm break-all">
                                                <span className="flex-1">{createdToken}</span>
                                                <button
                                                    onClick={() => copyToClipboard(createdToken)}
                                                    className="p-2 hover:bg-slate-700 rounded transition-colors flex-shrink-0"
                                                    title="Kopiuj"
                                                >
                                                    {copied ? <FiCheck className="text-green-500" /> : <FiCopy />}
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => setCreatedToken(null)}
                                                className="mt-3 text-sm text-slate-400 hover:text-white"
                                            >
                                                Rozumiem, zamknij
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Create form */}
                            {showCreateForm ? (
                                <div className="mb-6 p-4 bg-slate-700/50 rounded-lg">
                                    <h3 className="font-medium mb-4">Nowy token API</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">Nazwa</label>
                                            <input
                                                type="text"
                                                value={newToken.name}
                                                onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                                                placeholder="np. Integracja z CRM"
                                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm text-slate-400 mb-2">Uprawnienia</label>
                                            <div className="flex flex-wrap gap-4">
                                                {(['read', 'write', 'delete'] as const).map((perm) => (
                                                    <label key={perm} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={newToken.permissions[perm]}
                                                            onChange={(e) =>
                                                                setNewToken({
                                                                    ...newToken,
                                                                    permissions: {
                                                                        ...newToken.permissions,
                                                                        [perm]: e.target.checked,
                                                                    },
                                                                })
                                                            }
                                                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                                                        />
                                                        <span className="capitalize">{perm}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm text-slate-400 mb-1">
                                                Data wygaśnięcia (opcjonalne)
                                            </label>
                                            <input
                                                type="datetime-local"
                                                value={newToken.expiresAt}
                                                onChange={(e) => setNewToken({ ...newToken, expiresAt: e.target.value })}
                                                className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-6">
                                        <button
                                            onClick={handleCreate}
                                            disabled={isCreating}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
                                        >
                                            {isCreating ? 'Tworzenie...' : 'Utwórz token'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowCreateForm(false);
                                                setNewToken(defaultNewToken);
                                            }}
                                            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
                                        >
                                            Anuluj
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                    <FiPlus />
                                    Utwórz nowy token
                                </button>
                            )}

                            {/* Tokens list */}
                            <div>
                                <h3 className="font-medium mb-4">
                                    Aktywne tokeny ({activeTokens.length})
                                </h3>

                                {isLoading ? (
                                    <div className="text-center py-8 text-slate-400">Ładowanie...</div>
                                ) : activeTokens.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        Brak aktywnych tokenów. Utwórz pierwszy token aby rozpocząć integrację.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {activeTokens.map((token: BoardApiTokenListItem) => (
                                            <div
                                                key={token.id}
                                                className="p-4 bg-slate-700/50 rounded-lg"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate">
                                                            {token.name || 'API Token'}
                                                        </div>
                                                        <div className="text-sm text-slate-400 font-mono mt-1">
                                                            {token.token_prefix}***
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRevoke(token.id)}
                                                        disabled={revoking === token.id}
                                                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Unieważnij token"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>

                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {token.permissions.read && (
                                                        <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">
                                                            Read
                                                        </span>
                                                    )}
                                                    {token.permissions.write && (
                                                        <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                                                            Write
                                                        </span>
                                                    )}
                                                    {token.permissions.delete && (
                                                        <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                                                            Delete
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-3 text-xs text-slate-500 space-y-1">
                                                    <div>Utworzono: {formatDate(token.created_at)}</div>
                                                    <div>Ostatnie użycie: {formatDate(token.last_used_at)}</div>
                                                    {token.expires_at && (
                                                        <div>Wygasa: {formatDate(token.expires_at)}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* API Documentation hint */}
                            <div className="mt-8 p-4 bg-slate-700/30 rounded-lg">
                                <h4 className="font-medium mb-2">Jak używać API?</h4>
                                <p className="text-sm text-slate-400 mb-3">
                                    Użyj tokena w nagłówku Authorization:
                                </p>
                                <code className="block bg-slate-900 p-3 rounded text-sm font-mono text-green-400">
                                    Authorization: Bearer nkn_live_xxx...
                                </code>
                                <p className="text-sm text-slate-400 mt-3">
                                    Dostępne endpointy:
                                </p>
                                <ul className="text-sm text-slate-400 mt-2 space-y-1 list-disc list-inside">
                                    <li>GET /api/public/board - informacje o boardzie</li>
                                    <li>GET /api/public/tickets - lista ticketów</li>
                                    <li>POST /api/public/tickets - utwórz ticket</li>
                                    <li>PUT /api/public/tickets/[id] - aktualizuj ticket</li>
                                    <li>POST /api/public/tickets/[id]/comments - dodaj komentarz</li>
                                    <li>POST /api/public/tickets/[id]/attachments - dodaj załącznik</li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
