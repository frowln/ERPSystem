package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum InspectionRating {

    SATISFACTORY("Удовлетворительно"),
    NEEDS_IMPROVEMENT("Требует улучшения"),
    UNSATISFACTORY("Неудовлетворительно"),
    CRITICAL("Критическое");

    private final String displayName;
}
