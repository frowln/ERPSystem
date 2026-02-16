package com.privod.platform.modules.bidScoring.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ComparisonStatus {

    DRAFT("Черновик"),
    IN_PROGRESS("В процессе"),
    COMPLETED("Завершён"),
    APPROVED("Утверждён");

    private final String displayName;
}
