package com.privod.platform.modules.integration.telegram.service;

import com.privod.platform.modules.integration.telegram.domain.TelegramLinkCode;
import com.privod.platform.modules.integration.telegram.domain.TelegramSubscription;
import com.privod.platform.modules.integration.telegram.repository.TelegramLinkCodeRepository;
import com.privod.platform.modules.integration.telegram.repository.TelegramSubscriptionRepository;
import com.privod.platform.modules.integration.telegram.web.dto.TelegramMessageResponse;
import com.privod.platform.modules.integration.telegram.web.dto.TelegramSubscriptionResponse;
import com.privod.platform.modules.integration.telegram.web.dto.TelegramUpdate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TelegramWebhookService {

    private final TelegramBotService botService;
    private final TelegramSubscriptionRepository subscriptionRepository;
    private final TelegramLinkCodeRepository linkCodeRepository;

    /**
     * Process an incoming Telegram webhook update.
     */
    @Transactional
    public void processUpdate(TelegramUpdate update) {
        if (update == null || update.message() == null) {
            log.debug("Получен пустой update или update без сообщения, пропускаем");
            return;
        }

        TelegramUpdate.TelegramApiMessage msg = update.message();
        String chatId = String.valueOf(msg.chat().id());
        String text = msg.text();

        if (text == null || text.isBlank()) {
            log.debug("Получено сообщение без текста в чате {}, пропускаем", chatId);
            return;
        }

        log.info("Получено сообщение из чата {}: {}", chatId,
                text.length() > 50 ? text.substring(0, 50) + "..." : text);

        if (text.startsWith("/")) {
            String[] parts = text.split("\\s+", 2);
            String command = parts[0];
            String args = parts.length > 1 ? parts[1] : "";
            handleCommand(chatId, command, args);
        }
    }

    /**
     * Handle an incoming command from Telegram.
     */
    @Transactional
    public TelegramMessageResponse handleCommand(String chatId, String command, String args) {
        log.info("Обработка команды {} из чата {} с аргументами: {}", command, chatId, args);

        return switch (command.toLowerCase()) {
            case "/start" -> handleStartCommand(chatId, args);
            case "/register" -> handleRegisterCommand(chatId, args);
            default -> botService.processCommand(chatId, command);
        };
    }

    /**
     * Register a Telegram chat to a platform user.
     */
    @Transactional
    public TelegramSubscriptionResponse registerChat(String chatId, UUID userId) {
        if (subscriptionRepository.existsByUserIdAndChatIdAndDeletedFalse(userId, chatId)) {
            log.info("Подписка уже существует для пользователя {} в чате {}", userId, chatId);
            TelegramSubscription existing = subscriptionRepository
                    .findByChatIdAndDeletedFalse(chatId)
                    .orElseThrow();
            return TelegramSubscriptionResponse.fromEntity(existing);
        }

        TelegramSubscription subscription = TelegramSubscription.builder()
                .userId(userId)
                .chatId(chatId)
                .notifyProjects(true)
                .notifySafety(true)
                .notifyTasks(true)
                .notifyApprovals(true)
                .active(true)
                .build();

        subscription = subscriptionRepository.save(subscription);
        log.info("Чат {} привязан к пользователю {} (подписка {})", chatId, userId, subscription.getId());

        return TelegramSubscriptionResponse.fromEntity(subscription);
    }

    // --- Internal helpers ---

    private TelegramMessageResponse handleStartCommand(String chatId, String args) {
        if (args != null && !args.isBlank()) {
            // Deep link: /start <registration_code>
            log.info("Получена deep link регистрация из чата {} с кодом: {}", chatId, args);
            return processLinkCode(chatId, args);
        }

        return botService.sendMessage(chatId,
                "\uD83D\uDC4B Добро пожаловать в бот *Привод*!\n\n" +
                "Этот бот отправляет уведомления о ваших проектах, задачах, " +
                "оповещениях безопасности и согласованиях.\n\n" +
                "Для привязки аккаунта:\n" +
                "1. Перейдите в Настройки > Интеграции > Telegram на платформе Привод\n" +
                "2. Нажмите 'Привязать Telegram'\n" +
                "3. Отсканируйте QR-код или нажмите на ссылку\n\n" +
                "Или используйте команду /register с кодом.\n\n" +
                "Используйте /help для списка команд.");
    }

    private TelegramMessageResponse handleRegisterCommand(String chatId, String args) {
        if (args == null || args.isBlank()) {
            return botService.sendMessage(chatId,
                    "Для регистрации укажите ваш код:\n/register <код\\_регистрации>\n\n" +
                    "Получите код в настройках профиля на платформе Привод.");
        }

        return processLinkCode(chatId, args.trim());
    }

    private TelegramMessageResponse processLinkCode(String chatId, String code) {
        Optional<TelegramLinkCode> linkCodeOpt = linkCodeRepository.findByCodeAndUsedFalseAndDeletedFalse(code);

        if (linkCodeOpt.isEmpty()) {
            log.warn("Невалидный или использованный код привязки: {} из чата {}", code, chatId);
            return botService.sendMessage(chatId,
                    "\u274C Код привязки не найден или уже использован.\n\n" +
                    "Запросите новый код в настройках платформы Привод.");
        }

        TelegramLinkCode linkCode = linkCodeOpt.get();

        if (linkCode.isExpired()) {
            log.warn("Истёкший код привязки: {} из чата {}", code, chatId);
            return botService.sendMessage(chatId,
                    "\u23F0 Срок действия кода привязки истёк.\n\n" +
                    "Запросите новый код в настройках платформы Привод.");
        }

        // Mark link code as used
        linkCode.markUsed(chatId);
        linkCodeRepository.save(linkCode);

        // Create subscription
        TelegramSubscriptionResponse subscription = registerChat(chatId, linkCode.getUserId());

        log.info("Telegram аккаунт привязан: чат {} -> пользователь {} (код {})",
                chatId, linkCode.getUserId(), code);

        return botService.sendMessage(chatId,
                "\u2705 *Аккаунт успешно привязан!*\n\n" +
                "Теперь вы будете получать уведомления о:\n" +
                "\u2022 Проектах\n" +
                "\u2022 Задачах\n" +
                "\u2022 Безопасности\n" +
                "\u2022 Согласованиях\n\n" +
                "Используйте /help для списка команд.");
    }
}
