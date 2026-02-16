package com.privod.platform.modules.changeManagement.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ChangeEventSource {

    RFI("Запрос информации"),
    DESIGN_CHANGE("Изменение проекта"),
    FIELD_CONDITION("Полевые условия"),
    OWNER_REQUEST("Запрос заказчика"),
    REGULATORY("Нормативные требования"),
    VALUE_ENGINEERING("Стоимостная оптимизация"),
    OTHER("Прочее");

    private final String displayName;
}
