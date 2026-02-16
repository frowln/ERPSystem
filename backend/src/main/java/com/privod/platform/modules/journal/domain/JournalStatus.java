package com.privod.platform.modules.journal.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum JournalStatus {

    DRAFT("Черновик"),
    ACTIVE("Активный"),
    CLOSED("Закрыт"),
    ARCHIVED("Архивирован");

    private final String displayName;
}
