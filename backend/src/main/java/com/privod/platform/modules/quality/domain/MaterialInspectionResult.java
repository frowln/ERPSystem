package com.privod.platform.modules.quality.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MaterialInspectionResult {

    accepted("Принят"),
    rejected("Отклонён"),
    conditional("Условно принят");

    private final String displayName;
}
