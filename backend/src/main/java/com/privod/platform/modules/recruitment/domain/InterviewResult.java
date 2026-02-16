package com.privod.platform.modules.recruitment.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum InterviewResult {

    POSITIVE("Положительный"),
    NEGATIVE("Отрицательный"),
    NEUTRAL("Нейтральный"),
    NO_SHOW("Неявка");

    private final String displayName;
}
