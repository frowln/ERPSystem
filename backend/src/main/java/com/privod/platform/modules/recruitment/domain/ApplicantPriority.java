package com.privod.platform.modules.recruitment.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ApplicantPriority {

    NORMAL("Обычный"),
    GOOD("Хороший"),
    VERY_GOOD("Очень хороший"),
    EXCELLENT("Отличный");

    private final String displayName;
}
