const LOGO_BASE64 = 'data:image/webp;base64,UklGRh4EAABXRUJQVlA4WAoAAAAQAAAAgwAAgwAAQUxQSCwDAAANkAQAjCFJtT7btm3btu27n23btm3btm3bdmO6kkry3YsIB27bRpIrLzLneq7mDyq0u5G1UNpEn+6c3PuGm1KXyJTo1/3zO+6bUM3BznERkuUsuL7fE07KPzaSUiowceZS1ztewiraIncEJ2fTTm328tHw/B4RSo1cPfAvSonW+6Zw7b5h0RwuWu4dwr9vhuqoeqU2yOxjM3lohTZH1bKtEOoHSDL98AIG8lsBiNLy6iGwElaB5J53iEG5GPZedgWrhR0GUp6aSV0vhaXJ9/Im+L+A2aefnUor8DtUdylUaaBxppylLAMWgQNlgE5OEeEXMOPkTDovgyeK/9hDmmlIITg3hexsiEQxXyrgG4e5hsnnZtLU2mlOM0H+QVwGaiPJVmwTp4HEHCEwT4ybK4bNF6PmjEGLJ9DuQby5MMmEVynuY+L1SUYsAQOWAdpSQFoOKEsCYVmALQ2g5cHTf/0Mc3+UTkxqP9MxR/p39FTk9dZj5fFjnA4lO1z1VY1uSuooM+bOnuP3HqdIVqiccylMFiiili+WO0l89V+V8dePQJ9PH7/7NHGyfDn4iMBvxkxxznT/zpH7A5sFCX1el6p5RHjZ+8LG6CJ1qK13ilNtlyUXqCO9dDnuNlyYVJ576JM8q7o4mThDsjyvukgWR7tbaaBIcjcrDxxRFs+xrlYmHDLcxUqFRYixzE3NXgd7WsnQVJ+dmntj6GMi26sqFrzd20onnsN2bzIHX9tHmISxzcK2PZqGo+32aB6WpoBhe6SBl+32KISvYeHaZ5+NiKrT0sMvEqq3EYKgOtCP7rm9rDkdXD4GJ72dHFr3db88VBunZYBeI1g7SsG0v7/1BpNSbSpw4zaw1lWB3ZAh5j4j8JtVeQqo/HIYrL1/igO0fSz9t/ymCqjEvNntRutPsmaGM6GQl5UmZ9Lq3E6Ebgydq9PCddasxoJq4zPpgjRGpVx+cJK3Bt1wT60MNlbq4/2ZPWmKTDl58bBCHp9te0bz+8ca2bpG8dG3hRMNNKQXzRvEUS/vnNh9iVejGzajWLFMSSKoE7PXGkl5bfaiZ0o3mJxizZ4L9z6pUGuGAlZQOCDMAAAAsAoAnQEqhACEAD6dTqNNJaSjIiJ6qACwE4lpbt0B6BOeaOz1m3INnl4vZBs8vF6M0oyBETGWDDOFUEL8FuMl3MhJpu1vJOl2C3wr/2f4MdbJS0g2eYYeyDZ5eL2EAAD++2UACCiCERuOZb5nDyv/6/kHmy7x2rvIVPxEg+NF5tPnT5aurxXyrHrUifAV8omzoNSyTLJNNMvIwXRk2vjUxf+VKb6CbUYrS2DLizHEMvXcAkrtgQa3VM9MoCInYlAY5BTu0+QHguAAAAAA';

const baseStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.5;
    color: #1a1a1a;
    margin: 0;
    padding: 0;
    background-color: #f4f4f5;
    -webkit-font-smoothing: antialiased;
  }
  .wrapper {
    padding: 40px 20px;
  }
  .container {
    max-width: 480px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e4e4e7;
  }
  .logo-area {
    padding: 24px 32px 0 32px;
  }
  .body {
    padding: 20px 32px 28px 32px;
  }
  .action-text {
    font-size: 14px;
    color: #3f3f46;
    margin: 0 0 16px 0;
    line-height: 1.5;
  }
  .action-text strong {
    color: #09090b;
  }
  .task-link {
    font-size: 15px;
    font-weight: 600;
    color: #09090b;
    margin: 0 0 4px 0;
    line-height: 1.4;
  }
  .context {
    font-size: 13px;
    color: #a1a1aa;
    margin: 0;
  }
  .detail-box {
    margin: 16px 0 0 0;
    padding: 12px 16px;
    background: #fafafa;
    border-radius: 8px;
  }
  .status-pill {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }
  .pill-muted {
    background: #f4f4f5;
    color: #71717a;
  }
  .pill-green {
    background: #ecfdf5;
    color: #059669;
  }
  .pill-red {
    background: #fef2f2;
    color: #dc2626;
  }
  .arrow {
    color: #a1a1aa;
    margin: 0 6px;
    font-size: 12px;
  }
  .quote {
    margin: 12px 0 0 0;
    padding: 10px 14px;
    background: #fafafa;
    border-radius: 8px;
    font-size: 13px;
    color: #3f3f46;
    line-height: 1.5;
  }
  .btn {
    display: inline-block;
    color: #ffffff !important;
    padding: 10px 20px;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 500;
    font-size: 13px;
    margin-top: 20px;
  }
  .footer {
    padding: 20px 32px;
  }
  .footer p {
    font-size: 11px;
    color: #a1a1aa;
    margin: 0;
    line-height: 1.6;
  }
  .footer a {
    color: #71717a;
    text-decoration: underline;
  }
`;

const wrapHtml = (accentColor: string, content: string, footerText?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="logo-area">
        <img src="${LOGO_BASE64}" alt="Nokan" width="28" height="28" style="display: block;" />
      </div>
      <div class="body" data-accent="${accentColor}">
        ${content}
      </div>
      <div class="footer">
        <p>${footerText || 'Otrzymujesz tę wiadomość, ponieważ jesteś uczestnikiem tego zadania. <a href="#">Zarządzaj powiadomieniami</a>'}</p>
        <p style="margin-top: 12px; font-size: 10px; color: #d4d4d8; line-height: 1.5;">Ta wiadomość jest poufna i przeznaczona wyłącznie dla adresata. Jeśli otrzymałeś/aś ją omyłkowo, prosimy o niezwłoczne usunięcie. Zabronione jest kopiowanie lub ujawnianie treści osobom trzecim. Prosimy o niedrukowanie &mdash; dbajmy o środowisko.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

function colorBtn(taskUrl: string, label: string): string {
     return `<a href="${taskUrl}" class="btn" style="background: #09090b;">${label}</a>`;
}

function taskDot(color: string): string {
     return `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${color}; margin-right: 8px; position: relative; top: -1px; vertical-align: middle;"></span>`;
}

export function taskAssignedTemplate(
     taskTitle: string,
     boardName: string,
     taskUrl: string,
     assignerName?: string
): string {
     const c = '#00a68b';
     const actor = assignerName ? `<strong>${assignerName}</strong> przypisał(a) Ci zadanie` : 'Przypisano Ci zadanie';
     return wrapHtml(c, `
    <p class="action-text">${actor}</p>
    <p class="task-link">${taskDot(c)}${taskTitle}</p>
    <p class="context">${boardName}</p>
    ${colorBtn(taskUrl, 'Zobacz zadanie')}
  `);
}

export function taskUnassignedTemplate(
     taskTitle: string,
     boardName: string,
     taskUrl: string,
     unassignerName?: string
): string {
     const c = '#71717a';
     const actor = unassignerName ? `<strong>${unassignerName}</strong> usunął/ęła Cię z zadania` : 'Usunięto Cię z zadania';
     return wrapHtml(c, `
    <p class="action-text">${actor}</p>
    <p class="task-link">${taskDot(c)}${taskTitle}</p>
    <p class="context">${boardName}</p>
    ${colorBtn(taskUrl, 'Zobacz zadanie')}
  `);
}

export function taskStatusChangedTemplate(
     taskTitle: string,
     oldStatus: string,
     newStatus: string,
     taskUrl: string
): string {
     const c = '#22c55e';
     return wrapHtml(c, `
    <p class="action-text">Zmieniono status zadania</p>
    <p class="task-link">${taskDot(c)}${taskTitle}</p>
    <div class="detail-box">
      <span class="status-pill pill-muted">${oldStatus}</span>
      <span class="arrow">&rarr;</span>
      <span class="status-pill pill-green">${newStatus}</span>
    </div>
    ${colorBtn(taskUrl, 'Zobacz zadanie')}
  `);
}

export function taskPriorityChangedTemplate(
     taskTitle: string,
     oldPriority: string,
     newPriority: string,
     taskUrl: string
): string {
     const c = '#f59e0b';
     return wrapHtml(c, `
    <p class="action-text">Zmieniono priorytet zadania</p>
    <p class="task-link">${taskDot(c)}${taskTitle}</p>
    <div class="detail-box">
      <span class="status-pill pill-muted">${oldPriority}</span>
      <span class="arrow">&rarr;</span>
      <span class="status-pill pill-red">${newPriority}</span>
    </div>
    ${colorBtn(taskUrl, 'Zobacz zadanie')}
  `);
}

export function taskCommentedTemplate(
     taskTitle: string,
     commenterName: string,
     commentPreview: string,
     taskUrl: string
): string {
     const c = '#3b82f6';
     return wrapHtml(c, `
    <p class="action-text"><strong>${commenterName}</strong> skomentował(a) zadanie</p>
    <p class="task-link">${taskDot(c)}${taskTitle}</p>
    <div class="quote">${commentPreview}</div>
    ${colorBtn(taskUrl, 'Zobacz komentarz')}
  `);
}

export function taskDueDateChangedTemplate(
     taskTitle: string,
     newDueDate: string,
     taskUrl: string
): string {
     const c = '#f59e0b';
     return wrapHtml(c, `
    <p class="action-text">Zmieniono termin zadania</p>
    <p class="task-link">${taskDot(c)}${taskTitle}</p>
    <div class="detail-box">
      <span style="font-size: 13px; color: #71717a;">Nowy termin:</span>
      <strong style="font-size: 13px; color: #09090b; margin-left: 8px;">${newDueDate}</strong>
    </div>
    ${colorBtn(taskUrl, 'Zobacz zadanie')}
  `);
}

export function collaboratorAddedTemplate(
     taskTitle: string,
     boardName: string,
     taskUrl: string,
     adderName?: string
): string {
     const c = '#00a68b';
     const actor = adderName ? `<strong>${adderName}</strong> dodał(a) Cię jako współpracownika` : 'Dodano Cię jako współpracownika';
     return wrapHtml(c, `
    <p class="action-text">${actor}</p>
    <p class="task-link">${taskDot(c)}${taskTitle}</p>
    <p class="context">${boardName}</p>
    ${colorBtn(taskUrl, 'Zobacz zadanie')}
  `);
}

export function collaboratorRemovedTemplate(
     taskTitle: string,
     boardName: string,
     taskUrl: string,
     removerName?: string
): string {
     const c = '#71717a';
     const actor = removerName ? `<strong>${removerName}</strong> usunął/ęła Cię ze współpracowników` : 'Usunięto Cię ze współpracowników';
     return wrapHtml(c, `
    <p class="action-text">${actor}</p>
    <p class="task-link">${taskDot(c)}${taskTitle}</p>
    <p class="context">${boardName}</p>
    ${colorBtn(taskUrl, 'Zobacz zadanie')}
  `);
}

export function newSubmissionTemplate(
     taskTitle: string,
     boardName: string,
     taskUrl: string,
     clientName?: string,
     descriptionPreview?: string
): string {
     const c = '#00a68b';
     const actor = clientName ? `<strong>${clientName}</strong> przesłał(a) nowe zgłoszenie` : 'Nowe zgłoszenie';
     return wrapHtml(c, `
    <p class="action-text">${actor}</p>
    <p class="task-link">${taskDot(c)}${taskTitle}</p>
    <p class="context">${boardName}</p>
    ${descriptionPreview ? `<div class="quote">${descriptionPreview}</div>` : ''}
    ${colorBtn(taskUrl, 'Zobacz zgłoszenie')}
  `);
}

export function newCrmLeadTemplate(
     dealTitle: string,
     contactName: string,
     pipelineUrl: string,
     companyName?: string,
     email?: string,
     phone?: string,
     source?: string,
     value?: number,
     valueMax?: number,
     currency?: string,
     notes?: string
): string {
     const c = '#f59e0b';
     const formatValue = (v: number) => new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(v);
     const valueStr = value && value > 0
          ? (valueMax && valueMax > value ? `${formatValue(value)} – ${formatValue(valueMax)} ${currency || 'PLN'}` : `${formatValue(value)} ${currency || 'PLN'}`)
          : null;

     let detailRows = '';
     if (companyName) detailRows += `<tr><td style="padding: 4px 0; color: #a1a1aa; font-size: 13px; width: 100px;">Firma</td><td style="padding: 4px 0; font-size: 13px; color: #3f3f46;">${companyName}</td></tr>`;
     if (email) detailRows += `<tr><td style="padding: 4px 0; color: #a1a1aa; font-size: 13px;">Email</td><td style="padding: 4px 0; font-size: 13px; color: #3f3f46;"><a href="mailto:${email}" style="color: #00a68b; text-decoration: none;">${email}</a></td></tr>`;
     if (phone) detailRows += `<tr><td style="padding: 4px 0; color: #a1a1aa; font-size: 13px;">Telefon</td><td style="padding: 4px 0; font-size: 13px; color: #3f3f46;">${phone}</td></tr>`;
     if (source) detailRows += `<tr><td style="padding: 4px 0; color: #a1a1aa; font-size: 13px;">Źródło</td><td style="padding: 4px 0; font-size: 13px; color: #3f3f46;">${source}</td></tr>`;
     if (valueStr) detailRows += `<tr><td style="padding: 4px 0; color: #a1a1aa; font-size: 13px;">Wartość</td><td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #09090b;">${valueStr}</td></tr>`;

     return wrapHtml(c, `
    <p class="action-text">Nowy lead w CRM</p>
    <p class="task-link">${taskDot(c)}${dealTitle}</p>
    <p class="context">Kontakt: ${contactName}</p>
    <div class="detail-box">
      <table style="width: 100%; border-collapse: collapse;">${detailRows}</table>
    </div>
    ${notes ? `<div class="quote">${notes}</div>` : ''}
    ${colorBtn(pipelineUrl, 'Otwórz Pipeline')}
  `);
}

export function mentionTemplate(
     taskTitle: string,
     boardName: string,
     taskUrl: string,
     mentionerName?: string,
     context?: string
): string {
     const c = '#3b82f6';
     const actor = mentionerName ? `<strong>${mentionerName}</strong> wspomniał(a) o Tobie` : 'Wspomniano o Tobie';
     return wrapHtml(c, `
    <p class="action-text">${actor}</p>
    <p class="task-link">${taskDot(c)}${taskTitle}</p>
    <p class="context">${boardName}</p>
    ${context ? `<div class="quote">${context}</div>` : ''}
    ${colorBtn(taskUrl, 'Zobacz zadanie')}
  `);
}

export function boardInvitationTemplate(
     boardName: string,
     inviterName: string,
     inviteUrl: string
): string {
     const c = '#6366f1';
     return wrapHtml(c, `
    <p class="action-text"><strong>${inviterName}</strong> zaprasza Cię do tablicy</p>
    <p class="task-link">${taskDot(c)}${boardName}</p>
    <p class="context">Kliknij poniższy przycisk, aby dołączyć do tablicy i rozpocząć współpracę.</p>
    ${colorBtn(inviteUrl, 'Dołącz do tablicy')}
  `, 'Otrzymujesz tę wiadomość, ponieważ ktoś zaprosił Cię do współpracy w Nokan.');
}
