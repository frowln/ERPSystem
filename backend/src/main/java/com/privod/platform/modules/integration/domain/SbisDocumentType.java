package com.privod.platform.modules.integration.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SbisDocumentType {

    UPD("УПД"),
    TORG12("ТОРГ-12"),
    ACT("Акт"),
    INVOICE("Счёт-фактура"),
    POWER_OF_ATTORNEY("Доверенность"),
    RECONCILIATION("Акт сверки");

    private final String displayName;
}
