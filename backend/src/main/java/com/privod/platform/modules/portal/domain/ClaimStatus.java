package com.privod.platform.modules.portal.domain;

import java.util.EnumSet;
import java.util.Set;

public enum ClaimStatus {
    SUBMITTED("Подана"),
    TRIAGED("Рассмотрена"),
    ASSIGNED("Назначена"),
    IN_PROGRESS("В работе"),
    VERIFICATION("На проверке"),
    CLOSED("Закрыта"),
    REJECTED("Отклонена");

    private final String displayName;

    ClaimStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public Set<ClaimStatus> allowedTransitions() {
        return switch (this) {
            case SUBMITTED -> EnumSet.of(TRIAGED, REJECTED);
            case TRIAGED -> EnumSet.of(ASSIGNED, REJECTED);
            case ASSIGNED -> EnumSet.of(IN_PROGRESS, REJECTED);
            case IN_PROGRESS -> EnumSet.of(VERIFICATION, REJECTED);
            case VERIFICATION -> EnumSet.of(CLOSED, IN_PROGRESS, REJECTED);
            case CLOSED, REJECTED -> EnumSet.noneOf(ClaimStatus.class);
        };
    }

    public boolean canTransitionTo(ClaimStatus target) {
        return allowedTransitions().contains(target);
    }
}
