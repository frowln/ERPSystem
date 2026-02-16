package com.privod.platform.modules.portal.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PortalUserStatus {
    PENDING("Ожидает подтверждения"),
    ACTIVE("Активен"),
    BLOCKED("Заблокирован");

    private final String displayName;
}
