package com.privod.platform.modules.integration.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SbisDocumentStatus {

    DRAFT("Черновик"),
    SENT("Отправлен"),
    DELIVERED("Доставлен"),
    ACCEPTED("Принят"),
    REJECTED("Отклонён"),
    ERROR("Ошибка");

    private final String displayName;

    public boolean canTransitionTo(SbisDocumentStatus target) {
        return switch (this) {
            case DRAFT -> target == SENT || target == ERROR;
            case SENT -> target == DELIVERED || target == ERROR;
            case DELIVERED -> target == ACCEPTED || target == REJECTED;
            case ACCEPTED, REJECTED -> false;
            case ERROR -> target == DRAFT;
        };
    }
}
