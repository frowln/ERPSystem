package com.privod.platform.modules.cde.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RevisionStatus {

    CURRENT("Текущая"),
    SUPERSEDED("Заменена"),
    WITHDRAWN("Отозвана");

    private final String displayName;
}
