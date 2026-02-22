package com.privod.platform.modules.compliance.web.dto;

/**
 * Запрос на отзыв согласия (ст. 9, п. 2 152-ФЗ).
 */
public record RevokeConsentRequest(
        String reason
) {
}
