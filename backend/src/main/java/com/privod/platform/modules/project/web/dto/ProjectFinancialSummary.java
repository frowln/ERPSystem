package com.privod.platform.modules.project.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Comprehensive computed financial summary for a project.
 * All monetary values are aggregated from linked contracts, invoices, payments,
 * cost codes, commitments, budgets, and estimates.
 */
public record ProjectFinancialSummary(
        UUID projectId,

        // --- Revenue side (from customer) ---
        /** Sum of GENERAL contract amounts (revenue contracts with customer) */
        BigDecimal contractAmount,
        /** Sum of ISSUED invoices total amounts (invoiced to customer, excluding DRAFT/CANCELLED) */
        BigDecimal invoicedToCustomer,
        /** Sum of INCOMING payments with status PAID */
        BigDecimal receivedPayments,
        /** invoicedToCustomer - receivedPayments */
        BigDecimal accountsReceivable,

        // --- Expense side ---
        /** Planned budget from cost codes (sum of budgetAmount) or budget entities (sum of plannedCost) */
        BigDecimal plannedBudget,
        /** Sum of approved/active estimates totalAmount */
        BigDecimal estimateTotal,
        /** Sum of non-void commitment revised amounts */
        BigDecimal committed,
        /** Sum of SUBCONTRACT contract amounts */
        BigDecimal subcontractAmount,
        /** Sum of SUPPLY contract amounts */
        BigDecimal supplyAmount,
        /** Sum of SERVICE contract amounts */
        BigDecimal serviceAmount,
        /** Sum of RECEIVED invoices total amounts (from suppliers, excluding DRAFT/CANCELLED) */
        BigDecimal invoicedFromSuppliers,
        /** Sum of OUTGOING payments with status PAID */
        BigDecimal paidToSuppliers,
        /** invoicedFromSuppliers - paidToSuppliers */
        BigDecimal accountsPayable,
        /** Total actual cost: paidToSuppliers (realized expenses) */
        BigDecimal actualCost,

        // --- Derived metrics ---
        /** contractAmount - actualCost */
        BigDecimal margin,
        /** margin / contractAmount * 100 (or 0 if contractAmount is zero) */
        BigDecimal profitabilityPercent,
        /** actualCost / plannedBudget * 100 (or 0 if plannedBudget is zero) */
        BigDecimal budgetUtilizationPercent,
        /** receivedPayments - paidToSuppliers */
        BigDecimal cashFlow,
        /** actualCost / contractAmount * 100 — project completion by cost */
        BigDecimal completionPercent,

        // --- Preliminary (manual) values from the Project entity for comparison ---
        BigDecimal preliminaryBudget,
        BigDecimal preliminaryContractAmount
) {
}
