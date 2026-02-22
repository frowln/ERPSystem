package com.privod.platform.modules.commercialProposal.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ProposalItemStatus {
    UNPROCESSED("Не обработана"),
    INVOICES_COLLECTED("Счета собраны"),
    COMPETITIVE_LIST_FILLED("Конкурентный лист заполнен"),
    PRICE_SELECTED("Цена выбрана"),
    ON_APPROVAL("На согласовании"),
    APPROVED("Согласовано"),
    IN_FINANCIAL_MODEL("В финансовой модели"),

    // Legacy statuses kept for backward compatibility.
    PENDING("Ожидает"),
    INVOICE_SELECTED("Счёт выбран"),
    APPROVED_SUPPLY("Согласовано снабжением"),
    APPROVED_PROJECT("Согласовано проектом"),
    CONFIRMED("Подтверждено");

    private final String displayName;
}
