package com.privod.platform.modules.portfolio.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum OpportunityStage {

    LEAD("Лид"),
    QUALIFICATION("Квалификация"),
    PROPOSAL("Предложение"),
    NEGOTIATION("Переговоры"),
    WON("Выигран"),
    LOST("Проигран"),
    WITHDRAWN("Отозван");

    private final String displayName;

    public boolean canTransitionTo(OpportunityStage target) {
        return switch (this) {
            case LEAD -> target == QUALIFICATION || target == WITHDRAWN;
            case QUALIFICATION -> target == PROPOSAL || target == LOST || target == WITHDRAWN;
            case PROPOSAL -> target == NEGOTIATION || target == LOST || target == WITHDRAWN;
            case NEGOTIATION -> target == WON || target == LOST || target == WITHDRAWN;
            case WON, LOST, WITHDRAWN -> false;
        };
    }
}
