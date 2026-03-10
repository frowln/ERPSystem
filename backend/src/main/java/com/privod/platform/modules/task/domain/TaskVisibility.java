package com.privod.platform.modules.task.domain;

public enum TaskVisibility {
    /** Only creator + explicit participants can see the task */
    PARTICIPANTS_ONLY("Только участники"),
    /** All members of the project can see the task */
    PROJECT("Участники проекта"),
    /** Everyone in the organization */
    ORGANIZATION("Вся организация");

    private final String displayName;

    TaskVisibility(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
