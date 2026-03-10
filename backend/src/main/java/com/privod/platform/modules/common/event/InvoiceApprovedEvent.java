package com.privod.platform.modules.common.event;

import lombok.Getter;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Published when an invoice is approved for payment.
 * Listeners may use this to update budget commitments, trigger treasury workflows, etc.
 */
@Getter
public class InvoiceApprovedEvent extends DomainEvent {

    private final UUID invoiceId;
    private final UUID projectId;
    private final BigDecimal amount;
    private final UUID budgetItemId;

    public InvoiceApprovedEvent(UUID invoiceId, UUID projectId, BigDecimal amount, UUID budgetItemId) {
        this.invoiceId = invoiceId;
        this.projectId = projectId;
        this.amount = amount;
        this.budgetItemId = budgetItemId;
    }
}
