package com.privod.platform.modules.integration.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ExternalDocumentStatus {

    RECEIVED("Получен"),
    VIEWED("Просмотрен"),
    SIGNED("Подписан"),
    REJECTED("Отклонён"),
    CANCELLED("Аннулирован");

    private final String displayName;
}
