package com.privod.platform.modules.payroll.domain;

public enum PayrollCalculationStatus {

    DRAFT("Черновик"),
    CALCULATED("Рассчитан"),
    APPROVED("Утверждён"),
    PAID("Выплачен");

    private final String displayName;

    PayrollCalculationStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean canTransitionTo(PayrollCalculationStatus newStatus) {
        return switch (this) {
            case DRAFT -> newStatus == CALCULATED;
            case CALCULATED -> newStatus == APPROVED || newStatus == DRAFT;
            case APPROVED -> newStatus == PAID;
            case PAID -> false;
        };
    }
}
