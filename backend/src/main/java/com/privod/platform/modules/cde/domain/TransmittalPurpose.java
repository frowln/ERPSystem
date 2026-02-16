package com.privod.platform.modules.cde.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum TransmittalPurpose {

    FOR_INFORMATION("Для информации"),
    FOR_REVIEW("Для рассмотрения"),
    FOR_APPROVAL("Для утверждения"),
    FOR_CONSTRUCTION("Для производства работ"),
    AS_BUILT("Исполнительная");

    private final String displayName;
}
