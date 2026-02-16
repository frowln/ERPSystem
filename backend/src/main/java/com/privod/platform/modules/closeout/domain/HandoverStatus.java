package com.privod.platform.modules.closeout.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum HandoverStatus {

    DRAFT("Черновик"),
    IN_PREPARATION("Подготовка"),
    SUBMITTED("Передан"),
    ACCEPTED("Принят"),
    REJECTED("Отклонён");

    private final String displayName;
}
