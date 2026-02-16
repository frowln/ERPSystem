package com.privod.platform.modules.pto.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Ks6JournalStatus {

    DRAFT("Черновик"),
    ACTIVE("Активный"),
    CLOSED("Закрыт"),
    ARCHIVED("Архивирован");

    private final String displayName;
}
