package com.privod.platform.modules.taxRisk.domain;

public enum AssessmentStatus {

    DRAFT("Черновик"),
    IN_PROGRESS("В работе"),
    COMPLETED("Завершена"),
    ARCHIVED("В архиве");

    private final String displayName;

    AssessmentStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean canTransitionTo(AssessmentStatus newStatus) {
        return switch (this) {
            case DRAFT -> newStatus == IN_PROGRESS;
            case IN_PROGRESS -> newStatus == COMPLETED || newStatus == DRAFT;
            case COMPLETED -> newStatus == ARCHIVED;
            case ARCHIVED -> false;
        };
    }
}
