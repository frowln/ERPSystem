package com.privod.platform.modules.russianDoc.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EdoEnhancedDocumentStatus {

    CREATED("Создан"),
    SIGNED_BY_SENDER("Подписан отправителем"),
    SENT("Отправлен"),
    DELIVERED("Доставлен"),
    SIGNED_BY_RECEIVER("Подписан получателем"),
    REJECTED("Отклонён"),
    CANCELLED("Аннулирован");

    private final String displayName;

    public boolean canTransitionTo(EdoEnhancedDocumentStatus target) {
        return switch (this) {
            case CREATED -> target == SIGNED_BY_SENDER || target == CANCELLED;
            case SIGNED_BY_SENDER -> target == SENT || target == CANCELLED;
            case SENT -> target == DELIVERED || target == CANCELLED;
            case DELIVERED -> target == SIGNED_BY_RECEIVER || target == REJECTED;
            case SIGNED_BY_RECEIVER, REJECTED, CANCELLED -> false;
        };
    }
}
