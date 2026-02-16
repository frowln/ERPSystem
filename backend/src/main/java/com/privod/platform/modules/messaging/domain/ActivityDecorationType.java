package com.privod.platform.modules.messaging.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ActivityDecorationType {

    WARNING("Предупреждение"),
    DANGER("Опасность"),
    SUCCESS("Успех");

    private final String displayName;
}
