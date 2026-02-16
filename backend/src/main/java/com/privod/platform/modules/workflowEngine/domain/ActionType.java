package com.privod.platform.modules.workflowEngine.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ActionType {

    CHANGE_STATUS("Сменить статус"),
    SEND_NOTIFICATION("Отправить уведомление"),
    ASSIGN_USER("Назначить исполнителя"),
    CREATE_TASK("Создать задачу"),
    SEND_EMAIL("Отправить email"),
    WEBHOOK("Вебхук");

    private final String displayName;
}
