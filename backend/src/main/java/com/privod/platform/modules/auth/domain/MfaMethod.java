package com.privod.platform.modules.auth.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MfaMethod {

    TOTP("Приложение (TOTP)"),
    SMS("СМС"),
    EMAIL("Электронная почта");

    private final String displayName;
}
