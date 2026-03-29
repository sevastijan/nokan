import { NextRequest, NextResponse } from 'next/server';
import {
     taskAssignedTemplate,
     taskUnassignedTemplate,
     taskStatusChangedTemplate,
     taskPriorityChangedTemplate,
     taskCommentedTemplate,
     taskDueDateChangedTemplate,
     collaboratorAddedTemplate,
     collaboratorRemovedTemplate,
     mentionTemplate,
     newSubmissionTemplate,
} from '@/app/lib/email/templates';

const MOCK_URL = 'https://nokan.nkdlab.space/board/demo-board?task=demo-task';
const MOCK_BOARD = 'Projekt Alpha';

const templates: Record<string, { label: string; html: string }> = {
     task_assigned: {
          label: 'Przypisanie zadania',
          html: taskAssignedTemplate('Naprawić bug w logowaniu', MOCK_BOARD, MOCK_URL, 'Jan Kowalski'),
     },
     task_unassigned: {
          label: 'Usunięcie z zadania',
          html: taskUnassignedTemplate('Naprawić bug w logowaniu', MOCK_BOARD, MOCK_URL, 'Anna Nowak'),
     },
     status_changed: {
          label: 'Zmiana statusu',
          html: taskStatusChangedTemplate('Redesign strony głównej', 'Do zrobienia', 'W trakcie', MOCK_URL),
     },
     priority_changed: {
          label: 'Zmiana priorytetu',
          html: taskPriorityChangedTemplate('Optymalizacja bazy danych', 'Średni', 'Krytyczny', MOCK_URL),
     },
     new_comment: {
          label: 'Nowy komentarz',
          html: taskCommentedTemplate('API integracja z płatnościami', 'Michał Wiśniewski', 'Sprawdziłem endpoint - wygląda na to, że brakuje walidacji pola amount. Dodałbym middleware...', MOCK_URL),
     },
     due_date_changed: {
          label: 'Zmiana terminu',
          html: taskDueDateChangedTemplate('Przygotować prezentację Q2', '15 kwietnia 2026', MOCK_URL),
     },
     collaborator_added: {
          label: 'Dodanie współpracownika',
          html: collaboratorAddedTemplate('Migracja na Next.js 16', MOCK_BOARD, MOCK_URL, 'Piotr Zieliński'),
     },
     collaborator_removed: {
          label: 'Usunięcie współpracownika',
          html: collaboratorRemovedTemplate('Audit bezpieczeństwa', MOCK_BOARD, MOCK_URL, 'Katarzyna Lewandowska'),
     },
     mention: {
          label: 'Wzmianka (@mention)',
          html: mentionTemplate('Refaktor modułu auth', MOCK_BOARD, MOCK_URL, 'Tomasz Dąbrowski', 'Hej @user, możesz zerknąć na ten fragment? Nie jestem pewien czy to podejście jest ok...'),
     },
     new_submission: {
          label: 'Nowe zgłoszenie',
          html: newSubmissionTemplate('Błąd przy eksporcie raportu', MOCK_BOARD, MOCK_URL, 'Klient ABC Sp. z o.o.', 'Po kliknięciu "Eksportuj PDF" strona się zawiesza i nie generuje pliku. Problem występuje od wczoraj...'),
     },
};

export async function GET(request: NextRequest) {
     const { searchParams } = new URL(request.url);
     const type = searchParams.get('type');

     // Single template - render raw HTML for iframe
     if (type && templates[type]) {
          return new NextResponse(templates[type].html, {
               headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
     }

     // Index page with all templates
     const navItems = Object.entries(templates)
          .map(([key, { label }]) => `<a href="?type=${key}" target="preview" class="nav-item" data-type="${key}">${label}</a>`)
          .join('');

     const html = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template Preview — NOKAN</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #09090b; color: #fafafa; height: 100vh; display: flex; flex-direction: column; }
    .toolbar { display: flex; align-items: center; gap: 16px; padding: 12px 20px; background: #18181b; border-bottom: 1px solid #27272a; flex-shrink: 0; }
    .toolbar h1 { font-size: 14px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em; }
    .toolbar .dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; }
    .main { display: flex; flex: 1; overflow: hidden; }
    .sidebar { width: 260px; background: #18181b; border-right: 1px solid #27272a; overflow-y: auto; flex-shrink: 0; padding: 8px; }
    .nav-item { display: block; padding: 10px 14px; color: #a1a1aa; text-decoration: none; font-size: 13px; border-radius: 8px; transition: all 0.15s; }
    .nav-item:hover { background: #27272a; color: #fafafa; }
    .nav-item.active { background: #27272a; color: #fafafa; font-weight: 500; }
    .preview-area { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 32px; overflow-y: auto; background: #27272a; }
    .device-frame { width: 620px; background: #000; border-radius: 12px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
    .device-bar { height: 32px; background: #18181b; display: flex; align-items: center; padding: 0 12px; gap: 6px; }
    .device-bar span { width: 10px; height: 10px; border-radius: 50%; }
    .device-bar .r { background: #ef4444; } .device-bar .y { background: #eab308; } .device-bar .g { background: #22c55e; }
    iframe { width: 100%; height: 700px; border: none; background: #0f172a; }
    .empty-state { display: flex; align-items: center; justify-content: center; flex: 1; color: #52525b; font-size: 14px; }
  </style>
</head>
<body>
  <div class="toolbar">
    <span class="dot"></span>
    <h1>Email Preview — Nokan</h1>
  </div>
  <div class="main">
    <div class="sidebar">${navItems}</div>
    <div class="preview-area" id="previewArea">
      <div class="device-frame">
        <div class="device-bar"><span class="r"></span><span class="y"></span><span class="g"></span></div>
        <iframe name="preview" id="previewFrame"></iframe>
      </div>
    </div>
  </div>
  <script>
    const items = document.querySelectorAll('.nav-item');
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
    // Auto-load first template
    if (items.length > 0) {
      items[0].click();
      items[0].click();
    }
  </script>
</body>
</html>`;

     return new NextResponse(html, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
     });
}
