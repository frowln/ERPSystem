package com.privod.platform.modules.safety.domain;

public enum SafetyRiskLevel {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL;

    public static SafetyRiskLevel fromScore(int score) {
        if (score <= 25) return LOW;
        if (score <= 50) return MEDIUM;
        if (score <= 75) return HIGH;
        return CRITICAL;
    }

    public String getColor() {
        return switch (this) {
            case LOW -> "#22c55e";
            case MEDIUM -> "#f59e0b";
            case HIGH -> "#f97316";
            case CRITICAL -> "#ef4444";
        };
    }

    public String getDisplayName() {
        return switch (this) {
            case LOW -> "Низкий";
            case MEDIUM -> "Средний";
            case HIGH -> "Высокий";
            case CRITICAL -> "Критический";
        };
    }
}
