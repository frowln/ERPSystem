package com.privod.platform.modules.bim.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BimModelStatus {

    DRAFT("Черновик"),
    IMPORTED("Импортировано"),
    PROCESSED("Обработано"),
    LINKED("Связано со спецификацией");

    private final String displayName;
}
