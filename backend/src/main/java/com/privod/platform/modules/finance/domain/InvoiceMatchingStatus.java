package com.privod.platform.modules.finance.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum InvoiceMatchingStatus {
    UNMATCHED("Не привязан"),
    PARTIALLY_MATCHED("Частично привязан"),
    FULLY_MATCHED("Полностью привязан");

    private final String displayName;
}
