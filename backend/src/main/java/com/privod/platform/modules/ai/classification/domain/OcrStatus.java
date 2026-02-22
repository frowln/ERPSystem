package com.privod.platform.modules.ai.classification.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum OcrStatus {

    PENDING("Ожидание"),
    PROCESSING("Обработка"),
    COMPLETED("Завершено"),
    FAILED("Ошибка");

    private final String displayName;
}
