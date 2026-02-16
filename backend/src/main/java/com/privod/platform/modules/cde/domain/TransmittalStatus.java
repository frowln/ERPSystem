package com.privod.platform.modules.cde.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TransmittalStatus {

    DRAFT("Черновик"),
    ISSUED("Выпущен"),
    ACKNOWLEDGED("Подтверждён"),
    RESPONDED("С ответом"),
    CLOSED("Закрыт");

    private final String displayName;
}
