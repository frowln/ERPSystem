package com.privod.platform.modules.revenueRecognition.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RecognitionMethod {

    PERCENTAGE_OF_COMPLETION("Процент завершения"),
    INPUT_METHOD("Метод затрат"),
    OUTPUT_METHOD("Метод выпуска"),
    MILESTONE("Метод вех");

    private final String displayName;
}
