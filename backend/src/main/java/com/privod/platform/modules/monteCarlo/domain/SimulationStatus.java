package com.privod.platform.modules.monteCarlo.domain;

public enum SimulationStatus {

    DRAFT("Черновик"),
    RUNNING("Выполняется"),
    COMPLETED("Завершена"),
    FAILED("Ошибка");

    private final String displayName;

    SimulationStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean canTransitionTo(SimulationStatus newStatus) {
        return switch (this) {
            case DRAFT -> newStatus == RUNNING;
            case RUNNING -> newStatus == COMPLETED || newStatus == FAILED;
            case COMPLETED -> false;
            case FAILED -> newStatus == DRAFT;
        };
    }
}
