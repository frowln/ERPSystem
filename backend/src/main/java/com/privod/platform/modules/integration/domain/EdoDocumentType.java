package com.privod.platform.modules.integration.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EdoDocumentType {

    UPD("УПД"),
    ACT("Акт"),
    INVOICE("Счёт"),
    TORG12("ТОРГ-12"),
    SF("Счёт-фактура"),
    LETTER("Письмо");

    private final String displayName;
}
