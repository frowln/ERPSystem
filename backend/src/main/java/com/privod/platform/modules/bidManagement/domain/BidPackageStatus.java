package com.privod.platform.modules.bidManagement.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BidPackageStatus {

    DRAFT("Черновик"),
    OPEN("Открыт"),
    EVALUATION("Оценка"),
    AWARDED("Присуждён"),
    CLOSED("Закрыт");

    private final String displayName;
}
