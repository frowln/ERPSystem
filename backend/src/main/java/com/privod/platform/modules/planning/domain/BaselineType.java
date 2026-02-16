package com.privod.platform.modules.planning.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BaselineType {

    ORIGINAL("Исходный"),
    CURRENT("Текущий"),
    REVISED("Пересмотренный");

    private final String displayName;
}
