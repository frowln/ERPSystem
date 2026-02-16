package com.privod.platform.modules.safety.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum InspectionType {

    ROUTINE("Плановая"),
    UNSCHEDULED("Внеплановая"),
    FOLLOWUP("Повторная"),
    REGULATORY("Надзорная");

    private final String displayName;
}
