package com.privod.platform.modules.mobile.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MobilePlatform {
    IOS("iOS"),
    ANDROID("Android"),
    WEB("Веб");

    private final String displayName;
}
