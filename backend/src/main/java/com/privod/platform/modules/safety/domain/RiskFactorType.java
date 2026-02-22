package com.privod.platform.modules.safety.domain;

public enum RiskFactorType {
    INCIDENT_FREQUENCY,
    VIOLATION_TREND,
    TRAINING_COMPLIANCE,
    SUBCONTRACTOR_COUNT,
    CERT_EXPIRY,
    CREW_EXPERIENCE,
    WORK_COMPLEXITY,
    WEATHER_RISK;

    public String getDisplayName() {
        return switch (this) {
            case INCIDENT_FREQUENCY -> "Частота инцидентов";
            case VIOLATION_TREND -> "Тренд нарушений";
            case TRAINING_COMPLIANCE -> "Соответствие обучения";
            case SUBCONTRACTOR_COUNT -> "Количество субподрядчиков";
            case CERT_EXPIRY -> "Истечение сертификатов";
            case CREW_EXPERIENCE -> "Опыт бригады";
            case WORK_COMPLEXITY -> "Сложность работ";
            case WEATHER_RISK -> "Погодные риски";
        };
    }
}
