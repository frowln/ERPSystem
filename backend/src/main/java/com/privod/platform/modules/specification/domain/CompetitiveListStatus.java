package com.privod.platform.modules.specification.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CompetitiveListStatus {

    DRAFT("Черновик"),
    COLLECTING("Сбор предложений"),
    EVALUATING("Оценка"),
    DECIDED("Решение принято"),
    APPROVED("Утверждён");

    private final String displayName;
}
