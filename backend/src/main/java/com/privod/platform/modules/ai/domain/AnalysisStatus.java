package com.privod.platform.modules.ai.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AnalysisStatus {
    PENDING("Ожидание"),
    PROCESSING("Обработка"),
    COMPLETED("Завершён"),
    FAILED("Ошибка");

    private final String displayName;
}
