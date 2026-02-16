package com.privod.platform.modules.finance.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum InvoiceType {

    ISSUED("Выставленный"),
    RECEIVED("Полученный");

    private final String displayName;
}
