package com.privod.platform.modules.monteCarlo.domain;

public enum DistributionType {

    PERT("PERT"),
    TRIANGULAR("Треугольное"),
    NORMAL("Нормальное"),
    UNIFORM("Равномерное");

    private final String displayName;

    DistributionType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
