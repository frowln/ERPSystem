package com.privod.platform.modules.prequalification.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.prequalification.service.SroVerificationService;
import com.privod.platform.modules.prequalification.web.dto.SroVerificationResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST-контроллер для проверки членства подрядчиков в СРО.
 * <p>
 * Эндпоинты:
 * <ul>
 *   <li>GET /api/sro/verify/{inn} — проверить ИНН по реестру СРО</li>
 *   <li>POST /api/sro/verify/{inn}/refresh — принудительно обновить данные</li>
 *   <li>GET /api/sro/history — история всех проверок</li>
 *   <li>GET /api/sro/history/{inn} — история проверок по ИНН</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/sro")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "SRO Verification", description = "Проверка членства подрядчиков в СРО (ФЗ-315)")
public class SroVerificationController {

    private final SroVerificationService sroVerificationService;

    /**
     * Проверить членство подрядчика в СРО по ИНН.
     * <p>
     * Сначала ищет в локальном кэше (актуальность 24 часа),
     * при отсутствии — обращается к внешнему реестру.
     */
    @GetMapping("/verify/{inn}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Проверить членство подрядчика в СРО по ИНН",
            description = "Возвращает данные о членстве в СРО: наименование СРО, номер свидетельства, "
                    + "допустимые виды работ, уровень ответственности, размер взноса в компенсационный фонд.")
    public ResponseEntity<ApiResponse<SroVerificationResponse>> verify(
            @Parameter(description = "ИНН подрядчика (10 или 12 цифр)", example = "7708004767")
            @PathVariable String inn) {

        log.info("Запрос проверки СРО для ИНН: {}", inn);
        SroVerificationResponse result = sroVerificationService.verify(inn);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Принудительно обновить данные СРО, игнорируя кэш.
     * <p>
     * Используется, если есть подозрение на устаревшие данные
     * или статус подрядчика мог измениться (напр. приостановка членства).
     */
    @PostMapping("/verify/{inn}/refresh")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Принудительно обновить проверку СРО (игнорируя кэш)")
    public ResponseEntity<ApiResponse<SroVerificationResponse>> forceRefresh(
            @Parameter(description = "ИНН подрядчика (10 или 12 цифр)", example = "7708004767")
            @PathVariable String inn) {

        log.info("Принудительное обновление СРО для ИНН: {}", inn);
        SroVerificationResponse result = sroVerificationService.forceRefresh(inn);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Получить историю всех проверок СРО.
     * <p>
     * Возвращает все записи из кэша, отсортированные по дате проверки (новые первыми).
     * Используется для аудита и аналитики.
     */
    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "История всех проверок СРО")
    public ResponseEntity<ApiResponse<List<SroVerificationResponse>>> getHistory() {
        return ResponseEntity.ok(ApiResponse.ok(sroVerificationService.getHistory()));
    }

    /**
     * Получить историю проверок СРО для конкретного ИНН.
     */
    @GetMapping("/history/{inn}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "История проверок СРО по ИНН")
    public ResponseEntity<ApiResponse<List<SroVerificationResponse>>> getHistoryByInn(
            @Parameter(description = "ИНН подрядчика (10 или 12 цифр)", example = "7708004767")
            @PathVariable String inn) {
        return ResponseEntity.ok(ApiResponse.ok(sroVerificationService.getHistoryByInn(inn)));
    }

    /**
     * Обработка ошибки валидации ИНН.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Ошибка валидации СРО-запроса: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(ApiResponse.error(400, ex.getMessage()));
    }
}
