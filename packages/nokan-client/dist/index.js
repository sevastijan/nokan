"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AuthenticationError: () => AuthenticationError,
  NetworkError: () => NetworkError,
  NokanClient: () => NokanClient,
  NokanError: () => NokanError,
  NotFoundError: () => NotFoundError,
  PermissionError: () => PermissionError,
  RateLimitError: () => RateLimitError,
  TicketForm: () => TicketForm,
  TicketList: () => TicketList,
  TicketView: () => TicketView,
  TimeoutError: () => TimeoutError,
  ValidationError: () => ValidationError
});
module.exports = __toCommonJS(index_exports);

// src/errors.ts
var NokanError = class _NokanError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.name = "NokanError";
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, _NokanError.prototype);
  }
};
var AuthenticationError = class _AuthenticationError extends NokanError {
  constructor(message = "Authentication failed") {
    super(message, 401, "AUTHENTICATION_ERROR");
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, _AuthenticationError.prototype);
  }
};
var PermissionError = class _PermissionError extends NokanError {
  constructor(message = "Permission denied", requiredPermission) {
    super(message, 403, "PERMISSION_ERROR");
    this.name = "PermissionError";
    this.requiredPermission = requiredPermission;
    Object.setPrototypeOf(this, _PermissionError.prototype);
  }
};
var RateLimitError = class _RateLimitError extends NokanError {
  constructor(message = "Rate limit exceeded", retryAfter) {
    super(message, 429, "RATE_LIMIT_ERROR");
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
    if (retryAfter) {
      this.resetAt = new Date(Date.now() + retryAfter * 1e3);
    }
    Object.setPrototypeOf(this, _RateLimitError.prototype);
  }
};
var NotFoundError = class _NotFoundError extends NokanError {
  constructor(message = "Resource not found", resourceType, resourceId) {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
    this.resourceType = resourceType;
    this.resourceId = resourceId;
    Object.setPrototypeOf(this, _NotFoundError.prototype);
  }
};
var ValidationError = class _ValidationError extends NokanError {
  constructor(message, field) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
    this.field = field;
    Object.setPrototypeOf(this, _ValidationError.prototype);
  }
};
var TimeoutError = class _TimeoutError extends NokanError {
  constructor(message = "Request timeout") {
    super(message, 408, "TIMEOUT");
    this.name = "TimeoutError";
    Object.setPrototypeOf(this, _TimeoutError.prototype);
  }
};
var NetworkError = class _NetworkError extends NokanError {
  constructor(message = "Network error") {
    super(message, void 0, "NETWORK_ERROR");
    this.name = "NetworkError";
    Object.setPrototypeOf(this, _NetworkError.prototype);
  }
};

// src/client.ts
var NokanClient = class {
  constructor(config) {
    this.boardId = null;
    this.permissions = null;
    this.connected = false;
    if (!config.token) {
      throw new ValidationError("Token is required");
    }
    this.token = config.token;
    this.baseUrl = config.baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
    this.timeout = config.timeout || 3e4;
    if (!this.baseUrl) {
      throw new ValidationError("baseUrl is required when running in non-browser environment");
    }
  }
  /**
   * Connect to the API and discover board information
   * This method must be called before using other methods
   *
   * @returns Board info including permissions, columns, and statuses
   */
  async connect() {
    const response = await this.request("GET", "/api/public/board");
    this.boardId = response.data.id;
    this.permissions = response.data.permissions;
    this.connected = true;
    return {
      boardId: response.data.id,
      boardTitle: response.data.title,
      permissions: response.data.permissions,
      columns: response.data.columns,
      statuses: response.data.statuses
    };
  }
  /**
   * Get current board information
   * Requires: connect() to be called first, read permission
   */
  async getBoard() {
    this.ensureConnected();
    this.checkPermission("read");
    const response = await this.request("GET", "/api/public/board");
    return response.data;
  }
  /**
   * List tickets with pagination and filtering
   * Requires: read permission
   *
   * @param options - Pagination and filter options
   */
  async listTickets(options) {
    this.ensureConnected();
    this.checkPermission("read");
    const params = new URLSearchParams();
    if (options?.page) params.set("page", String(options.page));
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.column_id) params.set("column_id", options.column_id);
    if (options?.status_id) params.set("status_id", options.status_id);
    if (options?.completed !== void 0) params.set("completed", String(options.completed));
    const queryString = params.toString();
    const url = `/api/public/tickets${queryString ? `?${queryString}` : ""}`;
    return await this.request("GET", url);
  }
  /**
   * Get a single ticket by ID with comments and attachments
   * Requires: read permission
   *
   * @param ticketId - Ticket UUID
   */
  async getTicket(ticketId) {
    this.ensureConnected();
    this.checkPermission("read");
    if (!ticketId) {
      throw new ValidationError("Ticket ID is required");
    }
    const response = await this.request("GET", `/api/public/tickets/${ticketId}`);
    return response.data;
  }
  /**
   * Create a new ticket
   * Requires: write permission
   *
   * @param input - Ticket data
   */
  async createTicket(input) {
    this.ensureConnected();
    this.checkPermission("write");
    if (!input.title?.trim()) {
      throw new ValidationError("Title is required", "title");
    }
    if (!input.column_id) {
      throw new ValidationError("Column ID is required", "column_id");
    }
    const response = await this.request("POST", "/api/public/tickets", input);
    return response.data;
  }
  /**
   * Update an existing ticket
   * Requires: write permission
   *
   * @param ticketId - Ticket UUID
   * @param input - Fields to update
   */
  async updateTicket(ticketId, input) {
    this.ensureConnected();
    this.checkPermission("write");
    if (!ticketId) {
      throw new ValidationError("Ticket ID is required");
    }
    if (!input || Object.keys(input).length === 0) {
      throw new ValidationError("At least one field to update is required");
    }
    const response = await this.request("PUT", `/api/public/tickets/${ticketId}`, input);
    return response.data;
  }
  /**
   * Delete a ticket
   * Requires: delete permission
   *
   * @param ticketId - Ticket UUID
   */
  async deleteTicket(ticketId) {
    this.ensureConnected();
    this.checkPermission("delete");
    if (!ticketId) {
      throw new ValidationError("Ticket ID is required");
    }
    await this.request("DELETE", `/api/public/tickets/${ticketId}`);
  }
  /**
   * Add a comment to a ticket
   * Requires: write permission
   *
   * @param ticketId - Ticket UUID
   * @param input - Comment content
   */
  async addComment(ticketId, input) {
    this.ensureConnected();
    this.checkPermission("write");
    if (!ticketId) {
      throw new ValidationError("Ticket ID is required");
    }
    if (!input.content?.trim()) {
      throw new ValidationError("Comment content is required", "content");
    }
    const response = await this.request(
      "POST",
      `/api/public/tickets/${ticketId}/comments`,
      input
    );
    return response.data;
  }
  /**
   * List comments for a ticket
   * Requires: read permission
   *
   * @param ticketId - Ticket UUID
   */
  async listComments(ticketId) {
    this.ensureConnected();
    this.checkPermission("read");
    if (!ticketId) {
      throw new ValidationError("Ticket ID is required");
    }
    const response = await this.request(
      "GET",
      `/api/public/tickets/${ticketId}/comments`
    );
    return response.data;
  }
  /**
   * Upload an attachment to a ticket
   * Requires: write permission
   *
   * @param ticketId - Ticket UUID
   * @param file - File to upload (File, Blob, or Buffer)
   * @param fileName - File name (required if using Blob/Buffer)
   */
  async addAttachment(ticketId, file, fileName) {
    this.ensureConnected();
    this.checkPermission("write");
    if (!ticketId) {
      throw new ValidationError("Ticket ID is required");
    }
    if (!file) {
      throw new ValidationError("File is required");
    }
    const formData = new FormData();
    const name = fileName || (file instanceof File ? file.name : "attachment");
    formData.append("file", file, name);
    const response = await fetch(`${this.baseUrl}/api/public/tickets/${ticketId}/attachments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.token}`
      },
      body: formData
    });
    if (!response.ok) {
      await this.handleErrorResponse(response);
    }
    const result = await response.json();
    return result.data;
  }
  /**
   * List attachments for a ticket
   * Requires: read permission
   *
   * @param ticketId - Ticket UUID
   */
  async listAttachments(ticketId) {
    this.ensureConnected();
    this.checkPermission("read");
    if (!ticketId) {
      throw new ValidationError("Ticket ID is required");
    }
    const response = await this.request(
      "GET",
      `/api/public/tickets/${ticketId}/attachments`
    );
    return response.data;
  }
  /**
   * Check if connected to the API
   */
  isConnected() {
    return this.connected;
  }
  /**
   * Get current board ID (after connect)
   */
  getBoardId() {
    return this.boardId;
  }
  /**
   * Get current permissions (after connect)
   */
  getPermissions() {
    return this.permissions;
  }
  // === Private Methods ===
  ensureConnected() {
    if (!this.connected || !this.boardId) {
      throw new NokanError("Not connected. Call connect() first.");
    }
  }
  checkPermission(permission) {
    if (!this.permissions || !this.permissions[permission]) {
      throw new PermissionError(`Token does not have '${permission}' permission`, permission);
    }
  }
  async request(method, path, body) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          "Authorization": `Bearer ${this.token}`,
          "Content-Type": "application/json"
        },
        body: body ? JSON.stringify(body) : void 0,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof NokanError) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new TimeoutError(`Request timeout after ${this.timeout}ms`);
        }
        throw new NetworkError(error.message);
      }
      throw new NetworkError("Unknown network error");
    }
  }
  async handleErrorResponse(response) {
    let errorMessage = "Unknown error";
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.error || errorMessage;
    } catch {
    }
    const retryAfter = response.headers.get("Retry-After");
    switch (response.status) {
      case 401:
        throw new AuthenticationError(errorMessage);
      case 403:
        throw new PermissionError(errorMessage);
      case 404:
        throw new NotFoundError(errorMessage);
      case 429:
        throw new RateLimitError(errorMessage, retryAfter ? parseInt(retryAfter) : void 0);
      case 400:
        throw new ValidationError(errorMessage);
      default:
        throw new NokanError(errorMessage, response.status);
    }
  }
};

// src/components/TicketForm.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var defaultStyles = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxWidth: "500px"
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  label: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#374151"
  },
  input: {
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px"
  },
  textarea: {
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    minHeight: "100px",
    resize: "vertical"
  },
  select: {
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "white"
  },
  button: {
    padding: "10px 20px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer"
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
    cursor: "not-allowed"
  },
  error: {
    padding: "12px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    color: "#dc2626",
    fontSize: "14px"
  },
  success: {
    padding: "12px",
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "6px",
    color: "#16a34a",
    fontSize: "14px"
  }
};
function TicketForm({ client, onSuccess, onError, className }) {
  const [boardInfo, setBoardInfo] = (0, import_react.useState)(null);
  const [loading, setLoading] = (0, import_react.useState)(true);
  const [submitting, setSubmitting] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const [success, setSuccess] = (0, import_react.useState)(null);
  const [title, setTitle] = (0, import_react.useState)("");
  const [description, setDescription] = (0, import_react.useState)("");
  const [columnId, setColumnId] = (0, import_react.useState)("");
  const [priority, setPriority] = (0, import_react.useState)("medium");
  (0, import_react.useEffect)(() => {
    async function loadBoardInfo() {
      try {
        const info = await client.connect();
        setBoardInfo(info);
        if (info.columns.length > 0) {
          setColumnId(info.columns[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to connect");
      } finally {
        setLoading(false);
      }
    }
    loadBoardInfo();
  }, [client]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const input = {
        title: title.trim(),
        column_id: columnId,
        description: description.trim() || void 0,
        priority
      };
      const ticket = await client.createTicket(input);
      setSuccess(`Ticket "${ticket.title}" created successfully!`);
      setTitle("");
      setDescription("");
      setPriority("medium");
      onSuccess?.(ticket);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create ticket";
      setError(errorMsg);
      onError?.(err instanceof Error ? err : new Error(errorMsg));
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "Loading..." });
  }
  if (!boardInfo) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: defaultStyles.error, children: error || "Failed to load board info" });
  }
  if (!boardInfo.permissions.write) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: defaultStyles.error, children: "You don't have permission to create tickets" });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", { onSubmit: handleSubmit, style: defaultStyles.form, className, children: [
    error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: defaultStyles.error, children: error }),
    success && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: defaultStyles.success, children: success }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: defaultStyles.fieldGroup, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: defaultStyles.label, children: "Title *" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          type: "text",
          value: title,
          onChange: (e) => setTitle(e.target.value),
          required: true,
          placeholder: "Enter ticket title",
          style: defaultStyles.input
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: defaultStyles.fieldGroup, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: defaultStyles.label, children: "Description" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "textarea",
        {
          value: description,
          onChange: (e) => setDescription(e.target.value),
          placeholder: "Describe the issue...",
          style: defaultStyles.textarea
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: defaultStyles.fieldGroup, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: defaultStyles.label, children: "Column *" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "select",
        {
          value: columnId,
          onChange: (e) => setColumnId(e.target.value),
          required: true,
          style: defaultStyles.select,
          children: boardInfo.columns.map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: col.id, children: col.title }, col.id))
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: defaultStyles.fieldGroup, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: defaultStyles.label, children: "Priority" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "select",
        {
          value: priority,
          onChange: (e) => setPriority(e.target.value),
          style: defaultStyles.select,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "low", children: "Low" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "medium", children: "Medium" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "high", children: "High" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: "urgent", children: "Urgent" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        type: "submit",
        disabled: submitting || !title.trim(),
        style: {
          ...defaultStyles.button,
          ...submitting || !title.trim() ? defaultStyles.buttonDisabled : {}
        },
        children: submitting ? "Creating..." : "Create Ticket"
      }
    )
  ] });
}

// src/components/TicketView.tsx
var import_react2 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
var styles = {
  container: {
    backgroundColor: "white",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    overflow: "hidden"
  },
  header: {
    padding: "16px 20px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px"
  },
  title: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#111827",
    margin: 0
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#6b7280",
    padding: "4px"
  },
  body: {
    padding: "20px"
  },
  meta: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap"
  },
  badge: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: 500
  },
  description: {
    color: "#374151",
    fontSize: "14px",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap"
  },
  section: {
    marginTop: "24px",
    paddingTop: "24px",
    borderTop: "1px solid #e5e7eb"
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "12px"
  },
  comment: {
    padding: "12px",
    backgroundColor: "#f9fafb",
    borderRadius: "6px",
    marginBottom: "8px"
  },
  commentContent: {
    fontSize: "14px",
    color: "#374151",
    whiteSpace: "pre-wrap"
  },
  commentMeta: {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "8px"
  },
  attachment: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    backgroundColor: "#f9fafb",
    borderRadius: "6px",
    marginBottom: "8px",
    fontSize: "14px",
    color: "#374151"
  },
  attachmentIcon: {
    fontSize: "16px"
  },
  attachmentSize: {
    fontSize: "12px",
    color: "#6b7280",
    marginLeft: "auto"
  },
  form: {
    display: "flex",
    gap: "8px",
    marginTop: "12px"
  },
  input: {
    flex: 1,
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px"
  },
  button: {
    padding: "8px 16px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer"
  },
  fileInput: {
    display: "none"
  },
  fileButton: {
    padding: "8px 16px",
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer"
  },
  error: {
    padding: "12px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    color: "#dc2626",
    fontSize: "14px"
  },
  loading: {
    padding: "40px",
    textAlign: "center",
    color: "#6b7280"
  }
};
var priorityColors = {
  low: { bg: "#dbeafe", text: "#1e40af" },
  medium: { bg: "#fef3c7", text: "#92400e" },
  high: { bg: "#fed7aa", text: "#c2410c" },
  urgent: { bg: "#fecaca", text: "#dc2626" }
};
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString();
}
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
function TicketView({ client, ticketId, onClose, onUpdate, className }) {
  const [ticket, setTicket] = (0, import_react2.useState)(null);
  const [loading, setLoading] = (0, import_react2.useState)(true);
  const [error, setError] = (0, import_react2.useState)(null);
  const [newComment, setNewComment] = (0, import_react2.useState)("");
  const [submittingComment, setSubmittingComment] = (0, import_react2.useState)(false);
  const [uploadingFile, setUploadingFile] = (0, import_react2.useState)(false);
  const [permissions, setPermissions] = (0, import_react2.useState)({ read: false, write: false, delete: false });
  const loadTicket = (0, import_react2.useCallback)(async () => {
    try {
      const info = await client.connect();
      setPermissions(info.permissions);
      const data = await client.getTicket(ticketId);
      setTicket(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  }, [client, ticketId]);
  (0, import_react2.useEffect)(() => {
    loadTicket();
  }, [loadTicket]);
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const comment = await client.addComment(ticketId, { content: newComment.trim() });
      setTicket(
        (prev) => prev ? {
          ...prev,
          comments: [...prev.comments || [], comment]
        } : null
      );
      setNewComment("");
      if (ticket) onUpdate?.(ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const attachment = await client.addAttachment(ticketId, file);
      setTicket(
        (prev) => prev ? {
          ...prev,
          attachments: [...prev.attachments || [], attachment]
        } : null
      );
      if (ticket) onUpdate?.(ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload attachment");
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };
  if (loading) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.loading, children: "Loading ticket..." });
  }
  if (error && !ticket) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.error, children: error });
  }
  if (!ticket) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.error, children: "Ticket not found" });
  }
  const priorityStyle = priorityColors[ticket.priority] || priorityColors.medium;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.container, className, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.header, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { style: styles.title, children: ticket.title }),
      onClose && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { style: styles.closeButton, onClick: onClose, children: "\xD7" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.body, children: [
      error && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { ...styles.error, marginBottom: "16px" }, children: error }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.meta, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "span",
          {
            style: {
              ...styles.badge,
              backgroundColor: priorityStyle.bg,
              color: priorityStyle.text
            },
            children: ticket.priority
          }
        ),
        ticket.column && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { ...styles.badge, backgroundColor: "#e5e7eb", color: "#374151" }, children: ticket.column.title }),
        ticket.status && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
          "span",
          {
            style: {
              ...styles.badge,
              backgroundColor: ticket.status.color + "20",
              color: ticket.status.color
            },
            children: ticket.status.label
          }
        ),
        ticket.completed && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { ...styles.badge, backgroundColor: "#d1fae5", color: "#059669" }, children: "Completed" })
      ] }),
      ticket.description && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: styles.description, children: ticket.description }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { fontSize: "12px", color: "#6b7280", marginTop: "16px" }, children: [
        "Created: ",
        formatDate(ticket.created_at),
        ticket.updated_at !== ticket.created_at && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
          " \xB7 Updated: ",
          formatDate(ticket.updated_at)
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.section, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h3", { style: styles.sectionTitle, children: [
          "Comments (",
          ticket.comments?.length || 0,
          ")"
        ] }),
        ticket.comments?.map((comment) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.comment, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: styles.commentContent, children: comment.content }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.commentMeta, children: [
            comment.author?.name || "Anonymous",
            " \xB7 ",
            formatDate(comment.created_at)
          ] })
        ] }, comment.id)),
        ticket.comments?.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { color: "#6b7280", fontSize: "14px" }, children: "No comments yet" }),
        permissions.write && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("form", { onSubmit: handleAddComment, style: styles.form, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "input",
            {
              type: "text",
              value: newComment,
              onChange: (e) => setNewComment(e.target.value),
              placeholder: "Add a comment...",
              style: styles.input
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              type: "submit",
              disabled: submittingComment || !newComment.trim(),
              style: {
                ...styles.button,
                opacity: submittingComment || !newComment.trim() ? 0.5 : 1
              },
              children: submittingComment ? "..." : "Send"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.section, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h3", { style: styles.sectionTitle, children: [
          "Attachments (",
          ticket.attachments?.length || 0,
          ")"
        ] }),
        ticket.attachments?.map((attachment) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: styles.attachment, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: styles.attachmentIcon, children: "\u{1F4CE}" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: attachment.file_name }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: styles.attachmentSize, children: formatFileSize(attachment.file_size) })
        ] }, attachment.id)),
        ticket.attachments?.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { color: "#6b7280", fontSize: "14px" }, children: "No attachments" }),
        permissions.write && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { marginTop: "12px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "input",
            {
              type: "file",
              id: "file-upload",
              onChange: handleFileUpload,
              style: styles.fileInput
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: "file-upload", style: styles.fileButton, children: uploadingFile ? "Uploading..." : "+ Add Attachment" })
        ] })
      ] })
    ] })
  ] });
}

// src/components/TicketList.tsx
var import_react3 = require("react");
var import_jsx_runtime3 = require("react/jsx-runtime");
var styles2 = {
  container: {
    backgroundColor: "white",
    borderRadius: "8px",
    border: "1px solid #e5e7eb"
  },
  header: {
    padding: "16px 20px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap"
  },
  title: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#111827",
    margin: 0
  },
  filters: {
    display: "flex",
    gap: "8px",
    alignItems: "center"
  },
  select: {
    padding: "6px 10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "13px",
    backgroundColor: "white"
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0
  },
  item: {
    padding: "12px 20px",
    borderBottom: "1px solid #e5e7eb",
    cursor: "pointer",
    transition: "background-color 0.15s"
  },
  itemTitle: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#111827",
    marginBottom: "4px"
  },
  itemMeta: {
    display: "flex",
    gap: "8px",
    fontSize: "12px",
    color: "#6b7280"
  },
  badge: {
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: 500
  },
  pagination: {
    padding: "12px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #e5e7eb",
    fontSize: "13px",
    color: "#6b7280"
  },
  pageButton: {
    padding: "6px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: "13px"
  },
  empty: {
    padding: "40px 20px",
    textAlign: "center",
    color: "#6b7280"
  },
  loading: {
    padding: "40px",
    textAlign: "center",
    color: "#6b7280"
  },
  error: {
    padding: "12px 20px",
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    fontSize: "14px"
  }
};
var priorityColors2 = {
  low: { bg: "#dbeafe", text: "#1e40af" },
  medium: { bg: "#fef3c7", text: "#92400e" },
  high: { bg: "#fed7aa", text: "#c2410c" },
  urgent: { bg: "#fecaca", text: "#dc2626" }
};
function TicketList({ client, onTicketClick, className }) {
  const [boardInfo, setBoardInfo] = (0, import_react3.useState)(null);
  const [tickets, setTickets] = (0, import_react3.useState)([]);
  const [loading, setLoading] = (0, import_react3.useState)(true);
  const [error, setError] = (0, import_react3.useState)(null);
  const [page, setPage] = (0, import_react3.useState)(1);
  const [totalPages, setTotalPages] = (0, import_react3.useState)(1);
  const [total, setTotal] = (0, import_react3.useState)(0);
  const [columnFilter, setColumnFilter] = (0, import_react3.useState)("");
  const loadTickets = (0, import_react3.useCallback)(async () => {
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
        column_id: columnFilter || void 0
      });
      setTickets(response.data);
      setTotalPages(response.meta.pagination.total_pages);
      setTotal(response.meta.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [client, boardInfo, page, columnFilter]);
  (0, import_react3.useEffect)(() => {
    loadTickets();
  }, [loadTickets]);
  const handleColumnChange = (e) => {
    setColumnFilter(e.target.value);
    setPage(1);
  };
  if (loading && tickets.length === 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: styles2.loading, children: "Loading tickets..." });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: styles2.container, className, children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: styles2.header, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("h3", { style: styles2.title, children: [
        "Tickets (",
        total,
        ")"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: styles2.filters, children: boardInfo && boardInfo.columns.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "select",
        {
          value: columnFilter,
          onChange: handleColumnChange,
          style: styles2.select,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: "", children: "All columns" }),
            boardInfo.columns.map((col) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("option", { value: col.id, children: col.title }, col.id))
          ]
        }
      ) })
    ] }),
    error && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: styles2.error, children: error }),
    tickets.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: styles2.empty, children: "No tickets found" }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ul", { style: styles2.list, children: tickets.map((ticket) => {
      const priorityStyle = priorityColors2[ticket.priority] || priorityColors2.medium;
      return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "li",
        {
          style: styles2.item,
          onClick: () => onTicketClick?.(ticket.id),
          onMouseEnter: (e) => {
            e.currentTarget.style.backgroundColor = "#f9fafb";
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.backgroundColor = "white";
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: styles2.itemTitle, children: ticket.title }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: styles2.itemMeta, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                "span",
                {
                  style: {
                    ...styles2.badge,
                    backgroundColor: priorityStyle.bg,
                    color: priorityStyle.text
                  },
                  children: ticket.priority
                }
              ),
              ticket.column && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: ticket.column.title }),
              ticket.completed && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { color: "#059669" }, children: "\u2713 Completed" })
            ] })
          ]
        },
        ticket.id
      );
    }) }),
    totalPages > 1 && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: styles2.pagination, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          style: {
            ...styles2.pageButton,
            opacity: page <= 1 ? 0.5 : 1,
            cursor: page <= 1 ? "not-allowed" : "pointer"
          },
          disabled: page <= 1,
          onClick: () => setPage((p) => p - 1),
          children: "\u2190 Previous"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
        "Page ",
        page,
        " of ",
        totalPages
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          style: {
            ...styles2.pageButton,
            opacity: page >= totalPages ? 0.5 : 1,
            cursor: page >= totalPages ? "not-allowed" : "pointer"
          },
          disabled: page >= totalPages,
          onClick: () => setPage((p) => p + 1),
          children: "Next \u2192"
        }
      )
    ] })
  ] });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthenticationError,
  NetworkError,
  NokanClient,
  NokanError,
  NotFoundError,
  PermissionError,
  RateLimitError,
  TicketForm,
  TicketList,
  TicketView,
  TimeoutError,
  ValidationError
});
