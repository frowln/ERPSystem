package com.privod.platform.modules.closeout.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum WarrantyClaimStatus {

    OPEN("Открыт"),
    UNDER_REVIEW("На рассмотрении"),
    APPROVED("Одобрен"),
    IN_REPAIR("В ремонте"),
    RESOLVED("Решён"),
    REJECTED("Отклонён");

    private final String displayName;
}
