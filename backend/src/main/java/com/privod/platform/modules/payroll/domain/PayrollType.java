package com.privod.platform.modules.payroll.domain;

public enum PayrollType {

    SALARY("Оклад"),
    HOURLY("Почасовая"),
    PIECEWORK("Сдельная"),
    BONUS("Премиальная"),
    OVERTIME("Сверхурочная");

    private final String displayName;

    PayrollType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
