package com.privod.platform.modules.ai.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AiPromptCategory {
    DOCUMENT_GEN("Генерация документов"),
    REPORT("Отчёты"),
    ANALYSIS("Анализ"),
    QUERY("Запросы"),
    CLASSIFICATION("Классификация");

    private final String displayName;
}
