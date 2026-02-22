package com.privod.platform.modules.estimate.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ResourceType {

    LABOR("Трудозатраты"),
    MATERIAL("Материалы"),
    MACHINE("Машины и механизмы");

    private final String displayName;
}
