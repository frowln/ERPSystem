package com.privod.platform.modules.russianDoc.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum OcrTaskStatus {

    PENDING("Ожидает распознавания"),
    PROCESSING("Распознаётся"),
    COMPLETED("Завершено"),
    FAILED("Ошибка");

    private final String displayName;
}
