const baseStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #e2e8f0;
    margin: 0;
    padding: 0;
    background-color: #0f172a;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  }
  .header {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    padding: 32px 24px;
    text-align: center;
  }
  .header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: white;
    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  .header .icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  .content {
    padding: 32px 24px;
    background: #1e293b;
  }
  .card {
    background: linear-gradient(145deg, #334155 0%, #1e293b 100%);
    border: 1px solid #475569;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.3);
  }
  .task-title {
    font-size: 20px;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0 0 12px 0;
  }
  .meta {
    color: #94a3b8;
    font-size: 14px;
    margin: 8px 0;
  }
  .meta strong {
    color: #e2e8f0;
  }
  .badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    margin-right: 8px;
  }
  .badge-blue {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }
  .badge-purple {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }
  .badge-green {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }
  .badge-yellow {
    background: rgba(234, 179, 8, 0.2);
    color: #facc15;
    border: 1px solid rgba(234, 179, 8, 0.3);
  }
  .badge-red {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
  .button {
    display: inline-block;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white !important;
    padding: 14px 32px;
    text-decoration: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 14px;
    text-align: center;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
    transition: all 0.2s;
  }
  .button:hover {
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
  }
  .status-change {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: rgba(15, 23, 42, 0.5);
    border-radius: 12px;
    margin: 16px 0;
  }
  .status-arrow {
    color: #64748b;
    font-size: 20px;
  }
  .comment-box {
    background: rgba(15, 23, 42, 0.5);
    border-left: 4px solid;
    border-image: linear-gradient(180deg, #3b82f6, #2563eb) 1;
    padding: 16px 20px;
    margin: 16px 0;
    border-radius: 0 12px 12px 0;
    color: #cbd5e1;
    font-style: italic;
  }
  .footer {
    color: #64748b;
    font-size: 12px;
    padding: 24px;
    text-align: center;
    border-top: 1px solid #334155;
    background: #0f172a;
  }
  .footer a {
    color: #60a5fa;
    text-decoration: none;
  }
  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #475569, transparent);
    margin: 24px 0;
  }
  .logo {
    font-weight: 800;
    font-size: 20px;
    background: linear-gradient(135deg, #60a5fa, #3b82f6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

const wrapHtml = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    ${content}
    <div class="footer">
      <p class="logo">NOKAN</p>
      <p style="margin: 12px 0 0 0;">Ta wiadomość została wygenerowana automatycznie.</p>
      <p style="margin: 8px 0 0 0;">Możesz zarządzać <a href="#">preferencjami powiadomień</a> w ustawieniach.</p>
    </div>
  </div>
</body>
</html>
`;

export function taskAssignedTemplate(
     taskTitle: string,
     boardName: string,
     taskUrl: string,
     assignerName?: string
): string {
     return wrapHtml(`
    <div class="header">
      <div class="icon">📋</div>
      <h1>Przypisano Ci nowe zadanie</h1>
    </div>
    <div class="content">
      <div class="card">
        <p class="task-title">${taskTitle}</p>
        <div class="divider"></div>
        <p class="meta">
          <span class="badge badge-blue">${boardName}</span>
          ${assignerName ? `<span class="badge badge-purple">od ${assignerName}</span>` : ''}
        </p>
      </div>
      <div style="text-align: center;">
        <a href="${taskUrl}" class="button">🔗 Zobacz zadanie</a>
      </div>
    </div>
  `);
}

export function taskUnassignedTemplate(
     taskTitle: string,
     boardName: string,
     taskUrl: string,
     unassignerName?: string
): string {
     return wrapHtml(`
    <div class="header" style="background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);">
      <div class="icon">👋</div>
      <h1>Usunięto Cię z zadania</h1>
    </div>
    <div class="content">
      <div class="card">
        <p class="task-title">${taskTitle}</p>
        <div class="divider"></div>
        <p class="meta">
          <span class="badge badge-blue">${boardName}</span>
          ${unassignerName ? `<span class="badge badge-red">przez ${unassignerName}</span>` : ''}
        </p>
        <p class="meta" style="margin-top: 16px;">
          Nie jesteś już przypisany/a do tego zadania. Możesz nadal śledzić jego postęp na tablicy.
        </p>
      </div>
      <div style="text-align: center;">
        <a href="${taskUrl}" class="button" style="background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);">📋 Zobacz zadanie</a>
      </div>
    </div>
  `);
}

export function taskStatusChangedTemplate(
     taskTitle: string,
     oldStatus: string,
     newStatus: string,
     taskUrl: string
): string {
     return wrapHtml(`
    <div class="header" style="background: linear-gradient(135deg, #22c55e 0%, #14b8a6 100%);">
      <div class="icon">🔄</div>
      <h1>Zmiana statusu zadania</h1>
    </div>
    <div class="content">
      <div class="card">
        <p class="task-title">${taskTitle}</p>
        <div class="divider"></div>
        <div class="status-change">
          <span class="badge badge-yellow">${oldStatus}</span>
          <span class="status-arrow">→</span>
          <span class="badge badge-green">${newStatus}</span>
        </div>
      </div>
      <div style="text-align: center;">
        <a href="${taskUrl}" class="button" style="background: linear-gradient(135deg, #22c55e 0%, #14b8a6 100%);">🔗 Zobacz zadanie</a>
      </div>
    </div>
  `);
}

export function taskCommentedTemplate(
     taskTitle: string,
     commenterName: string,
     commentPreview: string,
     taskUrl: string
): string {
     return wrapHtml(`
    <div class="header">
      <div class="icon">💬</div>
      <h1>Nowy komentarz</h1>
    </div>
    <div class="content">
      <div class="card">
        <p class="task-title">${taskTitle}</p>
        <div class="divider"></div>
        <p class="meta"><span class="badge badge-purple">${commenterName}</span> dodał/a komentarz:</p>
        <div class="comment-box">
          "${commentPreview}"
        </div>
      </div>
      <div style="text-align: center;">
        <a href="${taskUrl}" class="button">💬 Zobacz komentarz</a>
      </div>
    </div>
  `);
}

export function taskDueDateChangedTemplate(
     taskTitle: string,
     newDueDate: string,
     taskUrl: string
): string {
     return wrapHtml(`
    <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);">
      <div class="icon">📅</div>
      <h1>Zmiana terminu zadania</h1>
    </div>
    <div class="content">
      <div class="card">
        <p class="task-title">${taskTitle}</p>
        <div class="divider"></div>
        <p class="meta">Nowy termin:</p>
        <p style="font-size: 24px; font-weight: 700; color: #fbbf24; margin: 16px 0;">
          📆 ${newDueDate}
        </p>
      </div>
      <div style="text-align: center;">
        <a href="${taskUrl}" class="button" style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);">🔗 Zobacz zadanie</a>
      </div>
    </div>
  `);
}

export function taskPriorityChangedTemplate(
     taskTitle: string,
     oldPriority: string,
     newPriority: string,
     taskUrl: string
): string {
     return wrapHtml(`
    <div class="header" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
      <div class="icon">🎯</div>
      <h1>Zmiana priorytetu zadania</h1>
    </div>
    <div class="content">
      <div class="card">
        <p class="task-title">${taskTitle}</p>
        <div class="divider"></div>
        <div class="status-change">
          <span class="badge badge-yellow">${oldPriority}</span>
          <span class="status-arrow">→</span>
          <span class="badge badge-purple">${newPriority}</span>
        </div>
      </div>
      <div style="text-align: center;">
        <a href="${taskUrl}" class="button" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">🔗 Zobacz zadanie</a>
      </div>
    </div>
  `);
}

export function collaboratorAddedTemplate(
     taskTitle: string,
     boardName: string,
     taskUrl: string,
     adderName?: string
): string {
     return wrapHtml(`
    <div class="header" style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);">
      <div class="icon">👥</div>
      <h1>Dodano Cię jako współpracownika</h1>
    </div>
    <div class="content">
      <div class="card">
        <p class="task-title">${taskTitle}</p>
        <div class="divider"></div>
        <p class="meta">
          <span class="badge badge-blue">${boardName}</span>
          ${adderName ? `<span class="badge badge-purple">przez ${adderName}</span>` : ''}
        </p>
        <p class="meta" style="margin-top: 16px;">
          Zostałeś/aś dodany/a jako współpracownik do tego zadania. Będziesz otrzymywać powiadomienia o zmianach.
        </p>
      </div>
      <div style="text-align: center;">
        <a href="${taskUrl}" class="button" style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);">👥 Zobacz zadanie</a>
      </div>
    </div>
  `);
}

export function collaboratorRemovedTemplate(
     taskTitle: string,
     boardName: string,
     taskUrl: string,
     removerName?: string
): string {
     return wrapHtml(`
    <div class="header" style="background: linear-gradient(135deg, #64748b 0%, #475569 100%);">
      <div class="icon">👤</div>
      <h1>Usunięto Cię ze współpracowników</h1>
    </div>
    <div class="content">
      <div class="card">
        <p class="task-title">${taskTitle}</p>
        <div class="divider"></div>
        <p class="meta">
          <span class="badge badge-blue">${boardName}</span>
          ${removerName ? `<span class="badge badge-yellow">przez ${removerName}</span>` : ''}
        </p>
        <p class="meta" style="margin-top: 16px;">
          Nie jesteś już współpracownikiem tego zadania. Możesz nadal śledzić jego postęp na tablicy.
        </p>
      </div>
      <div style="text-align: center;">
        <a href="${taskUrl}" class="button" style="background: linear-gradient(135deg, #64748b 0%, #475569 100%);">📋 Zobacz zadanie</a>
      </div>
    </div>
  `);
}

export function newSubmissionTemplate(
     taskTitle: string,
     boardName: string,
     taskUrl: string,
     clientName?: string,
     descriptionPreview?: string
): string {
     const descriptionHtml = descriptionPreview
          ? `<div class="comment-box">"${descriptionPreview}"</div>`
          : '';

     return wrapHtml(`
    <div class="header" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);">
      <div class="icon">📩</div>
      <h1>Nowe zgłoszenie od klienta</h1>
    </div>
    <div class="content">
      <div class="card">
        <p class="task-title">${taskTitle}</p>
        <div class="divider"></div>
        <p class="meta">
          <span class="badge badge-blue">${boardName}</span>
          ${clientName ? `<span class="badge badge-purple">od ${clientName}</span>` : ''}
        </p>
        ${descriptionHtml}
      </div>
      <div style="text-align: center;">
        <a href="${taskUrl}" class="button" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);">🔗 Zobacz zgłoszenie</a>
      </div>
    </div>
  `);
}

export function mentionTemplate(
     taskTitle: string,
     boardName: string,
     taskUrl: string,
     mentionerName?: string,
     context?: string
): string {
     const contextText = context
          ? `<div class="comment-box">"${context}"</div>`
          : '<p class="meta" style="margin-top: 16px;">w opisie zadania</p>';

     return wrapHtml(`
    <div class="header">
      <div class="icon">📣</div>
      <h1>Wspomniano Cię w zadaniu</h1>
    </div>
    <div class="content">
      <div class="card">
        <p class="task-title">${taskTitle}</p>
        <div class="divider"></div>
        <p class="meta">
          <span class="badge badge-blue">${boardName}</span>
          ${mentionerName ? `<span class="badge badge-purple">przez ${mentionerName}</span>` : ''}
        </p>
        ${contextText}
      </div>
      <div style="text-align: center;">
        <a href="${taskUrl}" class="button">🔗 Zobacz zadanie</a>
      </div>
    </div>
  `);
}
