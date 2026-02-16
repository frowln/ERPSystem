package com.privod.platform.modules.search.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SearchEntityType {
    PROJECT("Проект"),
    CONTRACT("Договор"),
    TASK("Задача"),
    DOCUMENT("Документ"),
    EMPLOYEE("Сотрудник"),
    MATERIAL("Материал"),
    INVOICE("Счёт");

    private final String displayName;
}
