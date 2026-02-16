package com.privod.platform.modules.pto.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum HiddenWorkActStatus {

    DRAFT("Черновик"),
    PENDING_INSPECTION("Ожидает осмотра"),
    INSPECTED("Осмотрен"),
    APPROVED("Утверждён"),
    REJECTED("Отклонён");

    private final String displayName;
}
