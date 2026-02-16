package com.privod.platform.modules.bim.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ClashStatus {

    NEW("Новая"),
    REVIEWED("Просмотрена"),
    RESOLVED("Решена"),
    APPROVED("Утверждена");

    private final String displayName;
}
