/**
 * Seed script — creates realistic support tickets for testing.
 *
 * Usage:
 *   API_BASE=http://localhost:8080 TOKEN=<jwt_token> node scripts/seed-support-data.mjs
 */

const API_BASE = process.env.API_BASE ?? 'http://localhost:8080';
const TOKEN = process.env.TOKEN ?? '';

if (!TOKEN) {
  console.error('Укажите TOKEN=<jwt_token>');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
};

/** Unwrap GlobalResponse envelope {success, data, ...} */
const unwrap = (json) => json?.data ?? json;

const post = async (path, body) => {
  const r = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (r.status === 409) { console.log(`   (skip duplicate) ${path}`); return null; }
  const data = await r.json().catch(() => null);
  if (!r.ok) { console.error(`POST ${path}: ${r.status}`, data); return null; }
  return unwrap(data);
};

const patch = async (path, body) => {
  const r = await fetch(`${API_BASE}${path}`, { method: 'PATCH', headers, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => null);
  if (!r.ok) { console.error(`PATCH ${path}: ${r.status}`, data); return null; }
  return unwrap(data);
};

const get = async (path) => {
  const r = await fetch(`${API_BASE}${path}`, { headers });
  const data = await r.json().catch(() => null);
  if (!r.ok) { console.error(`GET ${path}: ${r.status}`, data); return null; }
  return unwrap(data);
};

// Realistic support tickets for a construction ERP
const tickets = [
  {
    subject: 'Не загружается модуль сметной документации',
    description: 'При переходе в раздел "Сметы" отображается белый экран. Консоль браузера показывает ошибку 500. Проблема появилась после обновления системы вчера вечером. Критично для работы сметного отдела — 5 человек не могут работать.',
    category: 'TECHNICAL',
    priority: 'CRITICAL',
    comments: [
      { content: 'Воспроизвёл проблему. Ошибка связана с миграцией БД V1095. Начинаю исправление.', isInternal: true },
      { content: 'Проблема найдена и исправлена. Пожалуйста, очистите кэш браузера (Ctrl+Shift+Delete) и перезагрузите страницу. Если проблема сохраняется — сообщите.', isInternal: false },
      { content: 'Спасибо! Всё заработало. Кэш помог.', isInternal: false },
    ],
    resolveAfterComments: true,
  },
  {
    subject: 'Нет доступа к финансовому модулю для нового сотрудника',
    description: 'Приняли нового бухгалтера Петрову М.А. (mpetro@privod.ru). Нужно предоставить доступ к модулям: Финансы, Бюджеты, Счета. Роль — ACCOUNTANT. Срочно, сотрудник уже на рабочем месте.',
    category: 'ACCESS',
    priority: 'HIGH',
    comments: [
      { content: 'Создан пользователь mpetro@privod.ru, роль ACCOUNTANT, доступ к финансам настроен. Пароль отправлен на корпоративную почту.', isInternal: false },
    ],
    resolveAfterComments: true,
  },
  {
    subject: 'Ошибка при формировании акта КС-2',
    description: 'При нажатии кнопки "Сформировать PDF" для акта КС-2 № 15 по проекту ЖК "Рассвет" возвращается ошибка "Шаблон не найден". Сроки сдачи актов заказчику — завтра.',
    category: 'BUG',
    priority: 'HIGH',
    comments: [
      { content: 'Шаблон КС-2 был удалён при чистке тестовых данных. Восстановил. Проверено — PDF формируется корректно.', isInternal: false },
    ],
    resolveAfterComments: false,
  },
  {
    subject: 'Запрос: добавить столбец "Примечание" в реестр договоров',
    description: 'В реестре договоров не хватает столбца для примечаний. Юристы хотят фиксировать комментарии по каждому договору прямо в таблице, без необходимости открывать карточку. Это ускорит работу при проверках.',
    category: 'FEATURE_REQUEST',
    priority: 'LOW',
    comments: [
      { content: 'Внутренняя оценка: ~2-3 дня разработки. Включено в бэклог спринта 47.', isInternal: true },
      { content: 'Ваш запрос принят и включён в план разработки. Ориентировочный срок реализации — 2 недели.', isInternal: false },
    ],
    resolveAfterComments: false,
  },
  {
    subject: 'Как настроить уведомления по электронной почте?',
    description: 'Хочу получать email-уведомления при изменении статуса моих задач и при добавлении комментариев. Где это настраивается? Не могу найти в настройках профиля.',
    category: 'QUESTION',
    priority: 'LOW',
    comments: [
      { content: 'Email-уведомления настраиваются в разделе Настройки → Уведомления → Email. Там можно выбрать типы событий. Если раздел не отображается, возможно, нужно обновить страницу.', isInternal: false },
    ],
    resolveAfterComments: true,
  },
  {
    subject: 'Дубликаты позиций в спецификации после импорта XLSX',
    description: 'Загрузил спецификацию из Excel (файл spec_ventilation.xlsx). В результате часть позиций задвоилась — 47 строк вместо 23. ID позиций разные, но наименования и характеристики идентичны. Проект: ЖК "Привод-1", корпус 3.',
    category: 'BUG',
    priority: 'MEDIUM',
    dueDate: '2026-03-15',
    comments: [
      { content: 'Нашёл причину: парсер xlsx считывает объединённые ячейки как отдельные строки. Нужно доработать логику импорта.', isInternal: true },
      { content: 'Удалил дубликаты из спецификации. Рекомендую пока не загружать файлы с объединёнными ячейками — мы работаем над исправлением парсера.', isInternal: false },
    ],
    resolveAfterComments: false,
  },
  {
    subject: 'Не отображается GPS-трекинг техники на карте',
    description: 'На странице "Мониторинг флота" карта загружается, но маркеры техники не появляются. Раньше всё работало. Chrome 120, Windows 10. Скриншот прилагаю.',
    category: 'TECHNICAL',
    priority: 'MEDIUM',
    comments: [],
    resolveAfterComments: false,
  },
  {
    subject: 'Запрос на интеграцию с 1С:Бухгалтерия 8.3',
    description: 'Необходимо настроить выгрузку актов выполненных работ и счетов-фактур из системы ПРИВОД в 1С:Бухгалтерия 8.3. Формат обмена — XML (стандарт 1С). Есть ли такая возможность?',
    category: 'FEATURE_REQUEST',
    priority: 'MEDIUM',
    dueDate: '2026-04-01',
    comments: [
      { content: 'Интеграция с 1С уже реализована в модуле "Интеграции → 1С". Поддерживается обмен: контрагенты, счета, акты. Подключение через API-ключ. Инструкция: /docs/1c-integration.', isInternal: false },
    ],
    resolveAfterComments: true,
  },
  {
    subject: 'Медленная загрузка дашборда при большом количестве проектов',
    description: 'Главный дашборд загружается более 15 секунд. У нас 47 активных проектов. Раньше (при 20 проектах) всё было быстро. Рабочий процесс тормозится — руководство недовольно.',
    category: 'TECHNICAL',
    priority: 'HIGH',
    comments: [
      { content: 'Профилировал запросы: N+1 проблема при загрузке метрик проектов. Нужна оптимизация SQL-запросов + кэширование.', isInternal: true },
    ],
    resolveAfterComments: false,
  },
  {
    subject: 'Ошибка 403 при попытке удалить устаревший документ',
    description: 'Пытаюсь удалить документ "Акт_осмотра_2024.pdf" из раздела документов проекта, но получаю ошибку "Доступ запрещён". Я менеджер проекта и раньше мог удалять документы.',
    category: 'ACCESS',
    priority: 'MEDIUM',
    comments: [
      { content: 'Проверил права: документ загружен другим пользователем. По текущим настройкам RBAC удалять может только автор или администратор. Если нужно — могу удалить.', isInternal: false },
      { content: 'Да, пожалуйста, удалите. Документ устарел.', isInternal: false },
      { content: 'Удалено. Рекомендую подать запрос на расширение прав менеджера проекта, чтобы в будущем вы могли удалять документы по своему проекту.', isInternal: false },
    ],
    resolveAfterComments: true,
  },
  {
    subject: 'Нужна инструкция по работе с канбан-доской задач',
    description: 'Наша команда перешла на управление задачами через ПРИВОД. Нужна инструкция/видео по работе с канбан-доской: как создавать стадии, перемещать задачи, фильтровать.',
    category: 'QUESTION',
    priority: 'LOW',
    comments: [
      { content: 'Подготовил видео-инструкцию (3 мин) и PDF-памятку. Отправлю на почту вашей команды. Также доступно в Базе знаний → Задачи → Канбан.', isInternal: false },
    ],
    resolveAfterComments: true,
  },
  {
    subject: 'Неправильный расчёт НДС в бюджете проекта',
    description: 'В бюджете проекта "ЖК Лесной" НДС считается по ставке 20%, хотя с 01.01.2025 ставка 22%. Все суммы в бюджете занижены. Затрагивает 150+ позиций.',
    category: 'BUG',
    priority: 'CRITICAL',
    dueDate: '2026-03-12',
    comments: [
      { content: 'Подтверждаю: в формуле бюджета захардкожена ставка 0.20. Нужен hotfix. Приоритет — максимальный.', isInternal: true },
      { content: 'Исправление выпущено. Ставка НДС теперь берётся из настроек организации (по умолчанию 22%). Пересчёт бюджетов запущен автоматически. Проверьте, пожалуйста, суммы.', isInternal: false },
      { content: 'Проверил — суммы верные. Спасибо за оперативность!', isInternal: false },
    ],
    resolveAfterComments: true,
  },
];

async function main() {
  console.log('=== Seed Support Tickets ===\n');

  // Check existing tickets
  const existing = await get('/support/tickets?size=5');
  if (existing?.content?.length >= 10) {
    console.log(`Already have ${existing.content.length} tickets. Skipping seed.`);
    return;
  }

  let created = 0;
  const ticketIds = [];

  for (const t of tickets) {
    console.log(`Creating: "${t.subject.slice(0, 60)}..."`);

    const payload = {
      subject: t.subject,
      description: t.description,
      category: t.category,
      priority: t.priority,
      dueDate: t.dueDate ?? null,
    };

    const ticket = await post('/support/tickets', payload);
    if (!ticket) continue;
    created++;
    ticketIds.push(ticket.id);
    console.log(`   -> ${ticket.code} (${ticket.id})`);

    // Add comments
    for (const c of t.comments) {
      const comment = await post(`/support/tickets/${ticket.id}/comments`, {
        content: c.content,
        isInternal: c.isInternal ?? false,
      });
      if (comment) {
        console.log(`   + comment ${c.isInternal ? '(internal)' : '(public)'}`);
      }
    }

    // Resolve if needed
    if (t.resolveAfterComments) {
      // First start progress
      await patch(`/support/tickets/${ticket.id}/start`);
      // Then resolve
      const resolved = await patch(`/support/tickets/${ticket.id}/resolve`);
      if (resolved) {
        console.log('   -> RESOLVED');
      }
    }
  }

  console.log(`\n=== Done: ${created} tickets created ===`);
}

main().catch((e) => { console.error(e); process.exit(1); });
