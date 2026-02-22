package com.privod.platform.modules.closeout.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ZosStatus {

    DRAFT("Черновик"),
    UNDER_REVIEW("На рассмотрении"),
    APPROVED("Утверждён"),
    REJECTED("Отклонён");

    private final String displayName;
}
