package com.privod.platform.modules.ai.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AnalysisType {
    SUMMARY("Резюме"),
    EXTRACT_DATA("Извлечение данных"),
    CLASSIFY("Классификация"),
    COMPARE("Сравнение");

    private final String displayName;
}
