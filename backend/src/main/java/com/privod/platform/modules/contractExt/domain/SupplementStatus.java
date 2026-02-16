package com.privod.platform.modules.contractExt.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SupplementStatus {

    DRAFT("Черновик"),
    APPROVED("Согласовано"),
    SIGNED("Подписано");

    private final String displayName;
}
