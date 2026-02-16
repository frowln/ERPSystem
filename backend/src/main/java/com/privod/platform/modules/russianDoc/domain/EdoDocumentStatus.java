package com.privod.platform.modules.russianDoc.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EdoDocumentStatus {

    GENERATED("Сгенерирован"),
    SENT("Отправлен"),
    SIGNED("Подписан контрагентом"),
    REJECTED("Отклонён"),
    ERROR("Ошибка");

    private final String displayName;
}
