package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TrainingType {

    INITIAL("Вводный"),
    PERIODIC("Периодический"),
    UNSCHEDULED("Внеплановый"),
    SPECIAL("Целевой");

    private final String displayName;
}
