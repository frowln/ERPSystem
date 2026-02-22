package com.privod.platform.modules.contract.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ContractDirection {
    CLIENT("С заказчиком"),
    CONTRACTOR("С подрядчиком/поставщиком");

    private final String displayName;
}
