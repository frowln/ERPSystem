package com.privod.platform.modules.workflowEngine.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ApprovalEntityType {

    CONTRACT("Договор"),
    PURCHASE_REQUEST("Заявка на закупку"),
    INVOICE("Счёт"),
    PAYMENT("Платёж"),
    CHANGE_ORDER("Дополнительное соглашение");

    private final String displayName;
}
