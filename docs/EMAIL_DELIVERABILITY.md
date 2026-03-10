# Настройка почтовой доставки (SPF/DKIM/DMARC)

**Система:** Привод — Строительная ERP/CRM
**Версия документа:** 1.0
**Дата:** 2026-03-08
**Ответственный:** Руководитель разработки

---

## Обзор

Для надёжной доставки email-уведомлений из системы Привод необходимо настроить DNS-записи домена.
Без корректной настройки SPF, DKIM и DMARC письма будут попадать в спам или отклоняться
почтовыми серверами получателей.

| Технология | Назначение | DNS-запись |
|------------|-----------|------------|
| SPF | Определяет, какие серверы могут отправлять почту от домена | `TXT` на корневом домене |
| DKIM | Добавляет цифровую подпись к каждому письму | `TXT` на `selector._domainkey` |
| DMARC | Политика обработки писем, не прошедших SPF/DKIM | `TXT` на `_dmarc` |

---

## 1. SPF (Sender Policy Framework)

### 1.1 Что это

SPF указывает, какие серверы имеют право отправлять почту от имени домена `privod.ru`.
Почтовый сервер получателя проверяет IP-адрес отправителя по SPF-записи и принимает решение
о доставке.

### 1.2 DNS-запись

```
privod.ru.  IN  TXT  "v=spf1 a mx ip4:YOUR_SERVER_IP include:_spf.yandex.net ~all"
```

Замените `YOUR_SERVER_IP` на реальный IP-адрес сервера, с которого отправляется почта.

**Пример с конкретным IP:**

```
privod.ru.  IN  TXT  "v=spf1 a mx ip4:185.200.100.50 include:_spf.yandex.net ~all"
```

**Пример с подсетью (если несколько серверов):**

```
privod.ru.  IN  TXT  "v=spf1 a mx ip4:185.200.100.0/24 include:_spf.yandex.net ~all"
```

### 1.3 Рекомендации

- Используйте `~all` (softfail) на начальном этапе, затем переключитесь на `-all` (hardfail)
  после 2-4 недель мониторинга
- Если используется Yandex 360 для корпоративной почты — обязательно добавить
  `include:_spf.yandex.net`
- Если используется Mail.ru для бизнеса — `include:_spf.mail.ru`
- Максимум **10 DNS-lookup** в SPF-записи (include, a, mx, exists — каждый считается за lookup)
- `ip4:` и `ip6:` не считаются DNS-lookup
- Проверить количество lookup: `https://www.kitterman.com/spf/validate.html`

### 1.4 Частые ошибки

| Ошибка | Последствие |
|--------|------------|
| Больше 10 DNS-lookup | SPF permerror — запись игнорируется |
| Два TXT с `v=spf1` | Невалидная конфигурация |
| Забыли IP приложения | Письма из Spring Boot не пройдут SPF |
| `+all` вместо `~all` | Любой сервер может отправлять от вашего домена |

---

## 2. DKIM (DomainKeys Identified Mail)

### 2.1 Что это

DKIM добавляет цифровую подпись к заголовкам и телу каждого письма. Получатель проверяет
подпись с помощью публичного ключа, опубликованного в DNS. Это защищает от подделки содержимого
письма.

### 2.2 Генерация ключей

```bash
# Генерация приватного ключа (2048 бит — минимум для 2024+)
openssl genrsa -out dkim_private.pem 2048

# Извлечение публичного ключа
openssl rsa -in dkim_private.pem -pubout -out dkim_public.pem

# Получить base64-строку для DNS (без заголовков и переносов)
grep -v '^-' dkim_public.pem | tr -d '\n'
```

### 2.3 DNS-запись

```
privod._domainkey.privod.ru.  IN  TXT  "v=DKIM1; k=rsa; p=PUBLIC_KEY_BASE64"
```

Замените `PUBLIC_KEY_BASE64` на содержимое публичного ключа (одна строка, без `-----BEGIN/END-----`).

> **Важно**: Если ключ длинный (>255 символов), DNS TXT-запись нужно разбить на несколько строк:
> ```
> privod._domainkey.privod.ru.  IN  TXT  ( "v=DKIM1; k=rsa; p=MIIBIjANBgkqhki..."
>                                           "...остаток ключа..." )
> ```

### 2.4 Хранение приватного ключа

- **Никогда** не коммитить `dkim_private.pem` в git
- Хранить в секретном менеджере (Vault, AWS Secrets Manager) или как переменную окружения
- На сервере: файл с правами `600`, владелец — процесс приложения

```bash
chmod 600 /etc/privod/dkim_private.pem
chown privod:privod /etc/privod/dkim_private.pem
```

### 2.5 Настройка Spring Boot

**Вариант A — SimpleJavaMail (рекомендуется):**

Добавить зависимость в `build.gradle`:

```groovy
implementation 'org.simplejavamail:simple-java-mail:8.6.0'
implementation 'org.simplejavamail:dkim-module:8.6.0'
```

Конфигурация отправки с DKIM-подписью:

```java
import org.simplejavamail.api.mailer.Mailer;
import org.simplejavamail.mailer.MailerBuilder;
import org.simplejavamail.api.email.Email;
import org.simplejavamail.email.EmailBuilder;

@Configuration
public class MailConfig {

    @Value("${dkim.private-key-path}")
    private String dkimKeyPath;

    @Value("${dkim.signing-domain}")
    private String signingDomain;

    @Value("${dkim.selector}")
    private String selector; // "privod"

    @Bean
    public Mailer mailer() {
        return MailerBuilder
            .withSMTPServer("smtp.yandex.ru", 465)
            .withSMTPServerUsername("noreply@privod.ru")
            .withSMTPServerPassword(System.getenv("MAIL_PASSWORD"))
            .withTransportStrategy(TransportStrategy.SMTPS)
            .signByDefaultWithDomainKey(
                DkimConfig.builder()
                    .dkimPrivateKeyFile(new File(dkimKeyPath))
                    .dkimSigningDomain(signingDomain)
                    .dkimSelector(selector)
                    .build()
            )
            .buildMailer();
    }
}
```

**Вариант B — Jakarta Mail + angus-mail + DKIM-библиотека:**

```groovy
implementation 'de.agitos:javamail-crypto:1.1.3'
```

### 2.6 Ротация ключей

- Рекомендуется ротировать DKIM-ключи **раз в 6-12 месяцев**
- Процедура:
  1. Сгенерировать новую пару ключей с новым selector (например, `privod202701`)
  2. Опубликовать новый публичный ключ в DNS
  3. Дождаться распространения DNS (24-48 часов)
  4. Переключить приложение на новый приватный ключ
  5. Через неделю удалить старую DNS-запись

---

## 3. DMARC (Domain-based Message Authentication)

### 3.1 Что это

DMARC определяет политику обработки писем, не прошедших SPF и/или DKIM проверку.
Также позволяет получать агрегированные и forensic-отчёты о попытках отправки от вашего домена.

### 3.2 Этап 1 — Мониторинг (первые 2 недели)

```
_dmarc.privod.ru.  IN  TXT  "v=DMARC1; p=none; rua=mailto:dmarc@privod.ru; ruf=mailto:dmarc@privod.ru; fo=1"
```

| Параметр | Значение | Описание |
|----------|---------|----------|
| `p=none` | мониторинг | Письма доставляются, но отчёты приходят |
| `rua` | агрегированный отчёт | XML-отчёты раз в 24 часа |
| `ruf` | forensic-отчёт | Детали каждого провала |
| `fo=1` | при любом провале | Отчёт при провале SPF или DKIM (не обязательно обоих) |

### 3.3 Этап 2 — Карантин (после 2 недель мониторинга)

```
_dmarc.privod.ru.  IN  TXT  "v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@privod.ru"
```

Письма, не прошедшие проверку, попадают в спам получателя.

### 3.4 Этап 3 — Reject (после подтверждения корректной работы)

```
_dmarc.privod.ru.  IN  TXT  "v=DMARC1; p=reject; pct=100; rua=mailto:dmarc@privod.ru"
```

Письма, не прошедшие проверку, полностью отклоняются.

> **Важно**: Переходить к `p=reject` только после того, как DMARC-отчёты подтверждают 100%
> прохождение легитимных писем. Иначе пользователи не получат уведомления.

### 3.5 Alignment (выравнивание)

DMARC проверяет, что домен в `From:` совпадает с доменами SPF и DKIM:

- **SPF alignment**: домен `MAIL FROM` (envelope sender) совпадает с `From:` header
- **DKIM alignment**: домен в `d=` DKIM-подписи совпадает с `From:` header

Убедитесь, что приложение отправляет от `noreply@privod.ru` и DKIM подписывает для `privod.ru`.

---

## 4. Дополнительные DNS-записи

### 4.1 Обратный DNS (PTR)

PTR-запись должна указывать с IP-адреса сервера обратно на домен:

```
50.100.200.185.in-addr.arpa.  IN  PTR  mail.privod.ru.
```

> PTR-запись настраивается у хостинг-провайдера (не в DNS-панели домена).

### 4.2 MX-запись (если есть входящая почта)

```
privod.ru.  IN  MX  10  mx.yandex.net.
```

---

## 5. Проверка настроек

### 5.1 Инструменты онлайн-проверки

| Инструмент | URL | Что проверяет |
|------------|-----|--------------|
| MXToolbox | https://mxtoolbox.com/SuperTool.aspx | SPF, DKIM, DMARC, MX, PTR |
| Mail-tester | https://www.mail-tester.com/ | Полный аудит письма (score 10/10) |
| Dmarcian | https://dmarcian.com/dmarc-inspector/ | Разбор DMARC-записи |
| DKIM Validator | https://dkimvalidator.com/ | Проверка DKIM-подписи |
| Google Postmaster | https://postmaster.google.com/ | Репутация домена для Gmail |

### 5.2 Команды проверки из терминала

```bash
# SPF
dig TXT privod.ru

# DKIM
dig TXT privod._domainkey.privod.ru

# DMARC
dig TXT _dmarc.privod.ru

# MX
dig MX privod.ru

# PTR (обратный DNS)
dig -x YOUR_SERVER_IP
```

### 5.3 Проверка отправки тестового письма

```bash
# Через OpenSSL (ручная проверка SMTP)
openssl s_client -connect smtp.yandex.ru:465 -quiet

# Через curl
curl --ssl-reqd \
  --url 'smtps://smtp.yandex.ru:465' \
  --user 'noreply@privod.ru:PASSWORD' \
  --mail-from 'noreply@privod.ru' \
  --mail-rcpt 'test@example.com' \
  -T message.txt
```

---

## 6. Настройка application.yml для production

```yaml
spring:
  mail:
    host: smtp.yandex.ru
    port: 465
    username: noreply@privod.ru
    password: ${MAIL_PASSWORD}
    properties:
      mail.smtp.auth: true
      mail.smtp.ssl.enable: true
      mail.smtp.ssl.protocols: TLSv1.3
      mail.smtp.connectiontimeout: 5000
      mail.smtp.timeout: 5000
      mail.smtp.writetimeout: 5000

# DKIM
dkim:
  enabled: true
  private-key-path: /etc/privod/dkim_private.pem
  signing-domain: privod.ru
  selector: privod
```

### 6.1 Переменные окружения

```bash
# .env (НЕ коммитить в git!)
MAIL_PASSWORD=your_smtp_password
```

### 6.2 Обязательные заголовки писем

Каждое письмо из приложения должно содержать:

```
From: Привод <noreply@privod.ru>
Reply-To: support@privod.ru
List-Unsubscribe: <https://privod.ru/settings/notifications>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
X-Mailer: Privod-Platform/1.0
```

- **List-Unsubscribe** — обязателен для массовых рассылок (RFC 8058). Без него Gmail и Mail.ru
  могут помечать письма как спам.
- **Reply-To** — чтобы ответы шли на мониторируемый ящик, а не на `noreply@`.

---

## 7. Мониторинг доставляемости

### 7.1 Метрики для отслеживания

| Метрика | Норма | Проблема |
|---------|-------|---------|
| Bounce rate | < 2% | > 2% — нужна очистка списка |
| Complaint rate | < 0.1% | > 0.1% — письма помечаются как спам |
| DMARC pass rate | > 99% | < 95% — проверить SPF/DKIM |
| Open rate | > 20% | < 10% — проблемы с доставкой |

### 7.2 Обработка bounce-ов

В приложении необходимо обрабатывать bounce-ы:

- **Hard bounce** (550 — mailbox does not exist): удалить адрес из рассылки
- **Soft bounce** (452 — mailbox full): повторить через 4 часа, после 3 попыток — деактивировать

### 7.3 DMARC-отчёты

Агрегированные отчёты (`rua`) приходят в формате XML. Для их анализа:

- Сервисы: dmarcian.com, postmarkapp.com/dmarc
- Self-hosted: parsedmarc (Python) — https://github.com/domainaware/parsedmarc
- Встроить парсинг в мониторинг Grafana

### 7.4 Alerting (Prometheus + Grafana)

```yaml
# Prometheus alert rule
groups:
  - name: email_deliverability
    rules:
      - alert: HighBounceRate
        expr: rate(email_bounces_total[1h]) / rate(email_sent_total[1h]) > 0.02
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Bounce rate выше 2%"

      - alert: HighComplaintRate
        expr: rate(email_complaints_total[1h]) / rate(email_sent_total[1h]) > 0.001
        for: 15m
        labels:
          severity: critical
        annotations:
          summary: "Complaint rate выше 0.1%"
```

---

## 8. Чек-лист перед запуском

### DNS

- [ ] SPF-запись добавлена и валидна (< 10 DNS-lookup)
- [ ] DKIM-ключи сгенерированы (2048 бит)
- [ ] DKIM публичный ключ опубликован в DNS
- [ ] DMARC-запись добавлена в режиме `p=none`
- [ ] Обратный DNS (PTR) настроен для IP-адреса сервера
- [ ] MX-запись настроена (если есть входящая почта)

### Приложение

- [ ] `application.yml` настроен для production SMTP
- [ ] DKIM-подпись интегрирована в отправку писем
- [ ] `From` адрес соответствует домену (`@privod.ru`)
- [ ] Заголовок `List-Unsubscribe` добавлен
- [ ] Заголовок `List-Unsubscribe-Post` добавлен (RFC 8058)
- [ ] Обработка hard bounce реализована
- [ ] Обработка soft bounce реализована

### Тестирование

- [ ] Тестовое письмо проходит проверки на mail-tester.com (score 9+/10)
- [ ] SPF pass подтверждён в заголовках полученного письма
- [ ] DKIM pass подтверждён в заголовках полученного письма
- [ ] DMARC pass подтверждён в заголовках полученного письма
- [ ] Письмо не попадает в спам (Gmail, Yandex, Mail.ru)

### Мониторинг

- [ ] DMARC-отчёты приходят на `dmarc@privod.ru`
- [ ] Bounce rate мониторится (alert < 2%)
- [ ] Complaint rate мониторится (alert < 0.1%)
- [ ] Google Postmaster Tools подключён

---

## 9. План внедрения

| Неделя | Действие |
|--------|---------|
| 1 | Добавить SPF, DKIM, DMARC (p=none). Интегрировать DKIM в приложение |
| 2 | Мониторить DMARC-отчёты. Проверить все источники отправки |
| 3 | Переключить DMARC на `p=quarantine`. Настроить bounce-обработку |
| 4 | Проверить отчёты. При 100% pass — переключить на `p=reject` |
| 5+ | Регулярный мониторинг. Ротация DKIM-ключей раз в 6-12 месяцев |
