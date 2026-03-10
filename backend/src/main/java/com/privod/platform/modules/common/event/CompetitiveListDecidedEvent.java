package com.privod.platform.modules.common.event;

import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Published when a competitive list (конкурентный лист) decision is made — a winning supplier is selected.
 * Listeners may use this to update specification cost prices, notify procurement, etc.
 */
@Getter
public class CompetitiveListDecidedEvent extends DomainEvent {

    private final UUID competitiveListId;
    private final UUID specificationId;
    private final UUID winnerId;
    private final BigDecimal winnerPrice;

    public CompetitiveListDecidedEvent(UUID competitiveListId, UUID specificationId,
                                       UUID winnerId, BigDecimal winnerPrice) {
        this.competitiveListId = competitiveListId;
        this.specificationId = specificationId;
        this.winnerId = winnerId;
        this.winnerPrice = winnerPrice;
    }
}
