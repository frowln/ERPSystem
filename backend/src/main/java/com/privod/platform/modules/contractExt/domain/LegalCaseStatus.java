package com.privod.platform.modules.contractExt.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum LegalCaseStatus {

    PREPARATION("Подготовка"),
    FILED("Подано"),
    HEARING("Слушание"),
    DECIDED("Решено"),
    APPEAL("Апелляция"),
    CLOSED("Закрыто");

    private final String displayName;
}
