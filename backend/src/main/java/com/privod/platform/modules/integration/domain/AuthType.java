package com.privod.platform.modules.integration.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AuthType {

    API_KEY("API-ключ"),
    OAUTH2("OAuth 2.0"),
    CERTIFICATE("Сертификат"),
    BASIC("Базовая аутентификация");

    private final String displayName;
}
