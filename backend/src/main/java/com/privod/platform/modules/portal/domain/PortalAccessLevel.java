package com.privod.platform.modules.portal.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PortalAccessLevel {
    VIEW_ONLY("Только просмотр"),
    LIMITED("Ограниченный"),
    FULL("Полный");

    private final String displayName;
}
