package com.privod.platform.modules.russianDoc.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EdoAction {

    CREATED("Создан"),
    SIGNED("Подписан"),
    SENT("Отправлен"),
    RECEIVED("Получен"),
    ACCEPTED("Принят"),
    REJECTED("Отклонён");

    private final String displayName;
}
