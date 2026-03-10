package com.privod.platform.modules.task.domain;

public enum ParticipantRole {
    RESPONSIBLE("Ответственный"),
    CO_EXECUTOR("Соисполнитель"),
    OBSERVER("Наблюдатель");

    private final String displayName;

    ParticipantRole(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
