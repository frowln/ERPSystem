package com.privod.platform.modules.common.event;

import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Published when a KS-2 act (акт выполненных работ) is signed.
 * Listeners may use this to update budget actuals, trigger payment workflows, update project progress, etc.
 */
@Getter
public class Ks2SignedEvent extends DomainEvent {

    private final UUID ks2Id;
    private final UUID projectId;
    private final UUID contractId;
    private final BigDecimal totalAmount;

    public Ks2SignedEvent(UUID ks2Id, UUID projectId, UUID contractId, BigDecimal totalAmount) {
        this.ks2Id = ks2Id;
        this.projectId = projectId;
        this.contractId = contractId;
        this.totalAmount = totalAmount;
    }
}
