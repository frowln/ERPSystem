package com.privod.platform.modules.bim.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DrawingStatus {

    DRAFT("Черновик"),
    CURRENT("Действующий"),
    SUPERSEDED("Заменён"),
    ARCHIVED("Архивный");

    private final String displayName;
}
