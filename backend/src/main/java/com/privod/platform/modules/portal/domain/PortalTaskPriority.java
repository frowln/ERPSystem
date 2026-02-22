package com.privod.platform.modules.portal.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PortalTaskPriority {
    LOW("Низкий"),
    MEDIUM("Средний"),
    HIGH("Высокий"),
    URGENT("Срочный");

    private final String displayName;
}
