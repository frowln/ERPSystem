package com.privod.platform.modules.apiManagement.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ConnectorAuthType {

    API_KEY("API ключ"),
    OAUTH2("OAuth 2.0"),
    BASIC("Basic Auth"),
    HMAC("HMAC");

    private final String displayName;
}
