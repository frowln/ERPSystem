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

    public boolean canTransitionTo(CompetitiveListStatus target) {
        if (target == null) {
            return false;
        }
        if (this == target) {
            return true;
        }
        return switch (this) {
            case DRAFT -> target == COLLECTING;
            case COLLECTING -> target == EVALUATING || target == DRAFT;
            case EVALUATING -> target == DECIDED || target == COLLECTING;
            case DECIDED -> target == APPROVED || target == EVALUATING;
            case APPROVED -> false;
        };
    }
}
