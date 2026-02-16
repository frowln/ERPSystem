package com.privod.platform.modules.chatter.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ChatterActivityType {

    TASK("Задача"),
    CALL("Звонок"),
    EMAIL("Электронная почта"),
    MEETING("Встреча"),
    NOTE("Заметка"),
    DEADLINE("Дедлайн"),
    APPROVAL("Согласование");

    private final String displayName;
}
