package com.privod.platform.modules.bim.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DesignPackageStatus {

    DRAFT("Черновик"),
    IN_REVIEW("На проверке"),
    APPROVED("Утверждён"),
    SUPERSEDED("Заменён");

    private final String displayName;
}
