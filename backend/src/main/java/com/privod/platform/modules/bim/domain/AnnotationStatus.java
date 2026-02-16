package com.privod.platform.modules.bim.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AnnotationStatus {

    OPEN("Открыта"),
    RESOLVED("Решена"),
    CLOSED("Закрыта");

    private final String displayName;
}
