package com.privod.platform.modules.bim.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AnnotationType {

    TEXT("Текст"),
    ARROW("Стрелка"),
    RECTANGLE("Прямоугольник"),
    CIRCLE("Круг"),
    PIN("Булавка"),
    MEASUREMENT("Измерение"),
    CLOUD("Облако"),
    FREEHAND("Свободная линия");

    private final String displayName;
}
