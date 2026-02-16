package com.privod.platform.modules.planning.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WbsNodeType {

    PHASE("Фаза"),
    MILESTONE("Веха"),
    WORK_PACKAGE("Рабочий пакет"),
    ACTIVITY("Работа"),
    SUMMARY("Суммарная задача");

    private final String displayName;
}
