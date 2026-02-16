package com.privod.platform.modules.task.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DependencyType {

    FINISH_TO_START("Финиш-Старт"),
    START_TO_START("Старт-Старт"),
    FINISH_TO_FINISH("Финиш-Финиш"),
    START_TO_FINISH("Старт-Финиш");

    private final String displayName;
}
