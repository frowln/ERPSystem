package com.privod.platform.modules.project.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ProjectHealthStatus {

    ON_TRACK("В плане"),
    AT_RISK("Под риском"),
    OFF_TRACK("Отклонение"),
    ON_HOLD("Приостановлен");

    private final String displayName;
}
