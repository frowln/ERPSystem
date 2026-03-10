package com.privod.platform.modules.common.event;

import lombok.Getter;

import java.util.UUID;

/**
 * Published when a budget item field is updated.
 * Listeners may use this to recalculate budget totals, track cost variance, trigger alerts, etc.
 */
@Getter
public class BudgetItemUpdatedEvent extends DomainEvent {

    private final UUID budgetItemId;
    private final UUID budgetId;
    private final String field;
    private final String oldValue;
    private final String newValue;

    public BudgetItemUpdatedEvent(UUID budgetItemId, UUID budgetId,
                                  String field, String oldValue, String newValue) {
        this.budgetItemId = budgetItemId;
        this.budgetId = budgetId;
        this.field = field;
        this.oldValue = oldValue;
        this.newValue = newValue;
    }
}
