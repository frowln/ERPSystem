/**
 * i18n additions for H10 (SLA page), H11 (CalculationDisclaimer), H12 (Roskomnadzor).
 * Merge into ru.ts / en.ts later.
 */

export const additionsRu = {
  legal: {
    sla: {
      title: 'Соглашение об уровне обслуживания (SLA)',
      lastUpdated: 'Последнее обновление: 15 марта 2026 г.',
      s1title: '1. Гарантия доступности',
      s1text:
        'Платформа ПРИВОД гарантирует уровень доступности не менее 99,5% в течение каждого календарного месяца, за исключением периодов планового обслуживания. Доступность рассчитывается как (общее время в месяце минус время недоступности) / общее время в месяце * 100%.',
      s2title: '2. Плановое обслуживание',
      s2text:
        'Плановое обслуживание выполняется по воскресеньям с 03:00 до 06:00 по московскому времени (МСК). Уведомление о плановом обслуживании направляется не менее чем за 48 часов по электронной почте и через систему уведомлений платформы. Время планового обслуживания не учитывается при расчёте доступности.',
      s3title: '3. Время реакции на инциденты',
      s3text:
        'Мы классифицируем инциденты по четырём уровням критичности и гарантируем следующее время реакции:',
      incidentTableSeverity: 'Уровень критичности',
      incidentTableDescription: 'Описание',
      incidentTableResponse: 'Время реакции',
      incidentTableResolution: 'Время устранения',
      incidentCritical: 'Критический',
      incidentCriticalDesc: 'Система полностью недоступна',
      incidentCriticalResponse: '30 минут',
      incidentCriticalResolution: '4 часа',
      incidentHigh: 'Высокий',
      incidentHighDesc: 'Основная функция недоступна',
      incidentHighResponse: '2 часа',
      incidentHighResolution: '8 часов',
      incidentMedium: 'Средний',
      incidentMediumDesc: 'Функция работает с ограничениями',
      incidentMediumResponse: '8 часов',
      incidentMediumResolution: '24 часа',
      incidentLow: 'Низкий',
      incidentLowDesc: 'Косметический дефект',
      incidentLowResponse: '24 часа',
      incidentLowResolution: '5 рабочих дней',
      s4title: '4. Каналы поддержки',
      s4text:
        'Техническая поддержка доступна через следующие каналы: электронная почта support@privod.ru (круглосуточно), Telegram-бот @privod_support_bot, тикет-система в приложении (раздел «Поддержка»). Время работы живых операторов: пн-пт 09:00-18:00 МСК.',
      s5title: '5. Резервное копирование и восстановление',
      s5text:
        'Резервное копирование данных выполняется ежедневно с хранением копий в течение 30 дней. Целевая точка восстановления (RPO) составляет не более 24 часов. Целевое время восстановления (RTO) составляет не более 4 часов. Резервные копии хранятся в географически распределённых дата-центрах.',
      s6title: '6. Компенсация при нарушении SLA',
      s6text:
        'В случае нарушения гарантированного уровня доступности (99,5%) подписка продлевается на время простоя, умноженное на коэффициент 10. Например, при простое 1 час сверх допустимого — продление подписки на 10 часов. Для получения компенсации необходимо направить запрос в службу поддержки в течение 30 дней с момента инцидента.',
      s7title: '7. Исключения',
      s7text:
        'Гарантия доступности не распространяется на: форс-мажорные обстоятельства, действия или бездействие Заказчика, проблемы на стороне интернет-провайдера Заказчика, плановое обслуживание (п. 2), атаки типа «отказ в обслуживании» (DDoS), работы, вызванные запросом Заказчика на изменение конфигурации.',
      s8title: '8. Контактная информация',
      s8text:
        'По вопросам SLA обращайтесь: support@privod.ru, тел. +7 (495) 000-00-00, Telegram: @privod_support_bot.',
    },
  },
  disclaimer: {
    general: 'Расчёты носят справочный характер. Проверяйте результаты перед принятием финансовых решений.',
    estimate: 'Расчёты носят справочный характер. Проверяйте результаты перед принятием финансовых решений.',
    budget: 'Расчёты носят справочный характер. Проверяйте результаты перед принятием финансовых решений.',
    pricing: 'Расчёты носят справочный характер. Проверяйте результаты перед принятием финансовых решений.',
    lsrImport:
      'Импортированные данные могут содержать расхождения с оригиналом. Сверьте итоги с бумажным экземпляром.',
    dontShowAgain: 'Не показывать снова',
    fileChecksum: 'Контрольная сумма файла (SHA-256)',
  },
  admin: {
    rkn: {
      title: 'Уведомление в Роскомнадзор',
      subtitle: 'Контрольный список для подачи уведомления об обработке персональных данных',
      sectionChecklist: 'Контрольный список',
      sectionForm: 'Обязательные поля уведомления',
      sectionStatus: 'Статус подачи',
      checkRegistration: 'Зарегистрировать учётную запись на портале pd.rkn.gov.ru',
      checkPurpose: 'Определить цели обработки персональных данных',
      checkLegalBasis: 'Подготовить правовое основание обработки ПДн',
      checkCategories: 'Определить категории обрабатываемых персональных данных',
      checkSubjects: 'Определить категории субъектов персональных данных',
      checkMeasures: 'Описать меры по обеспечению безопасности ПДн',
      checkCrossBorder: 'Определить наличие трансграничной передачи ПДн',
      checkDpo: 'Назначить ответственного за организацию обработки ПДн',
      checkSubmit: 'Подать уведомление через портал Роскомнадзора',
      fieldOperator: 'Наименование оператора',
      fieldInn: 'ИНН',
      fieldAddress: 'Адрес (юридический)',
      fieldPurpose: 'Цель обработки персональных данных',
      fieldCategories: 'Категории персональных данных',
      fieldLegalBasis: 'Правовое основание обработки',
      fieldSubjects: 'Категории субъектов ПДн',
      fieldMeasures: 'Меры по обеспечению безопасности',
      fieldStartDate: 'Дата начала обработки ПДн',
      portalLink: 'Перейти на портал Роскомнадзора (pd.rkn.gov.ru)',
      portalUrl: 'https://pd.rkn.gov.ru',
      statusNotSubmitted: 'Не подано',
      statusSubmitted: 'Подано',
      statusApproved: 'Принято',
      statusDate: 'Дата изменения статуса',
      statusHint: 'Отслеживайте статус подачи уведомления.',
      infoTitle: 'Справочная информация',
      infoText:
        'В соответствии со статьёй 22 Федерального закона от 27.07.2006 N 152-ФЗ «О персональных данных», оператор обязан до начала обработки персональных данных уведомить уполномоченный орган по защите прав субъектов персональных данных (Роскомнадзор) о своём намерении осуществлять обработку персональных данных.',
      infoExceptions:
        'Исключения из обязанности уведомления перечислены в п. 2 ст. 22 152-ФЗ (обработка в соответствии с трудовым законодательством, обработка данных участников религиозных организаций, и др.).',
      templateTitle: 'Шаблон уведомления',
      templateHint: 'Скачайте шаблон уведомления об обработке персональных данных для заполнения.',
      templateDownload: 'Скачать шаблон (DOCX)',
    },
  },
};

export const additionsEn = {
  legal: {
    sla: {
      title: 'Service Level Agreement (SLA)',
      lastUpdated: 'Last updated: March 15, 2026',
      s1title: '1. Availability Guarantee',
      s1text:
        'The PRIVOD platform guarantees a minimum availability of 99.5% per calendar month, excluding scheduled maintenance windows. Availability is calculated as (total time minus downtime) / total time * 100%.',
      s2title: '2. Scheduled Maintenance',
      s2text:
        'Scheduled maintenance is performed on Sundays from 03:00 to 06:00 MSK. Notification is provided at least 48 hours in advance via email and platform notifications. Scheduled maintenance windows are excluded from availability calculations.',
      s3title: '3. Incident Response Times',
      s3text:
        'We classify incidents into four severity levels with the following guaranteed response times:',
      incidentTableSeverity: 'Severity',
      incidentTableDescription: 'Description',
      incidentTableResponse: 'Response Time',
      incidentTableResolution: 'Resolution Time',
      incidentCritical: 'Critical',
      incidentCriticalDesc: 'System completely unavailable',
      incidentCriticalResponse: '30 minutes',
      incidentCriticalResolution: '4 hours',
      incidentHigh: 'High',
      incidentHighDesc: 'Core feature unavailable',
      incidentHighResponse: '2 hours',
      incidentHighResolution: '8 hours',
      incidentMedium: 'Medium',
      incidentMediumDesc: 'Feature works with limitations',
      incidentMediumResponse: '8 hours',
      incidentMediumResolution: '24 hours',
      incidentLow: 'Low',
      incidentLowDesc: 'Cosmetic defect',
      incidentLowResponse: '24 hours',
      incidentLowResolution: '5 business days',
      s4title: '4. Support Channels',
      s4text:
        'Technical support is available via: email support@privod.ru (24/7), Telegram bot @privod_support_bot, in-app ticket system (Support section). Live agent hours: Mon-Fri 09:00-18:00 MSK.',
      s5title: '5. Backup and Recovery',
      s5text:
        'Data backups are performed daily and retained for 30 days. Recovery Point Objective (RPO) is 24 hours or less. Recovery Time Objective (RTO) is 4 hours or less. Backups are stored in geographically distributed data centers.',
      s6title: '6. SLA Breach Compensation',
      s6text:
        'In case of breach of the guaranteed availability level (99.5%), the subscription is extended by the downtime duration multiplied by 10. For example, 1 hour of unplanned downtime = 10 hours of subscription extension. Compensation requests must be submitted within 30 days of the incident.',
      s7title: '7. Exclusions',
      s7text:
        'The availability guarantee does not apply to: force majeure events, customer actions or inaction, issues with the customer\'s ISP, scheduled maintenance (section 2), DDoS attacks, changes requested by the customer.',
      s8title: '8. Contact Information',
      s8text:
        'For SLA inquiries: support@privod.ru, tel. +7 (495) 000-00-00, Telegram: @privod_support_bot.',
    },
  },
  disclaimer: {
    general: 'Calculations are for reference only. Verify results before making financial decisions.',
    estimate: 'Calculations are for reference only. Verify results before making financial decisions.',
    budget: 'Calculations are for reference only. Verify results before making financial decisions.',
    pricing: 'Calculations are for reference only. Verify results before making financial decisions.',
    lsrImport:
      'Imported data may differ from the original. Verify totals against the paper copy.',
    dontShowAgain: 'Don\'t show again',
    fileChecksum: 'File checksum (SHA-256)',
  },
  admin: {
    rkn: {
      title: 'Roskomnadzor Notification',
      subtitle: 'Checklist for personal data processing notification',
      sectionChecklist: 'Checklist',
      sectionForm: 'Required notification fields',
      sectionStatus: 'Submission status',
      checkRegistration: 'Register an account on pd.rkn.gov.ru portal',
      checkPurpose: 'Define purposes of personal data processing',
      checkLegalBasis: 'Prepare legal basis for PD processing',
      checkCategories: 'Define categories of processed personal data',
      checkSubjects: 'Define categories of PD subjects',
      checkMeasures: 'Describe PD security measures',
      checkCrossBorder: 'Determine cross-border PD transfer presence',
      checkDpo: 'Appoint a Data Protection Officer',
      checkSubmit: 'Submit notification via Roskomnadzor portal',
      fieldOperator: 'Operator name',
      fieldInn: 'Tax ID (INN)',
      fieldAddress: 'Legal address',
      fieldPurpose: 'Purpose of personal data processing',
      fieldCategories: 'Personal data categories',
      fieldLegalBasis: 'Legal basis for processing',
      fieldSubjects: 'PD subject categories',
      fieldMeasures: 'Security measures',
      fieldStartDate: 'PD processing start date',
      portalLink: 'Go to Roskomnadzor portal (pd.rkn.gov.ru)',
      portalUrl: 'https://pd.rkn.gov.ru',
      statusNotSubmitted: 'Not submitted',
      statusSubmitted: 'Submitted',
      statusApproved: 'Approved',
      statusDate: 'Status change date',
      statusHint: 'Track notification submission status.',
      infoTitle: 'Reference Information',
      infoText:
        'In accordance with Article 22 of Federal Law No. 152-FZ dated July 27, 2006 "On Personal Data", the operator is obliged to notify the authorized body (Roskomnadzor) of its intention to process personal data before beginning such processing.',
      infoExceptions:
        'Exceptions to the notification obligation are listed in para. 2 of Art. 22 of 152-FZ (processing under labor law, processing data of religious organization members, etc.).',
      templateTitle: 'Notification Template',
      templateHint: 'Download the personal data processing notification template.',
      templateDownload: 'Download template (DOCX)',
    },
  },
};
