package com.privod.platform.modules.settings.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum IntegrationType {

    REST_API("REST API"),
    WEBHOOK("Вебхук"),
    FILE_IMPORT("Импорт файлов"),
    OAUTH2("OAuth 2.0");

    private final String displayName;
}
