package com.privod.platform.modules.russianDoc.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EdoEnhancedDocumentType {

    UPD("УПД"),
    UTD("УТД"),
    ACT_SVERKI("Акт сверки"),
    TORG12("ТОРГ-12"),
    SCHF("Счёт-фактура"),
    CORRECTIVE_SCHF("Корректировочный счёт-фактура"),
    KS2("КС-2"),
    KS3("КС-3");

    private final String displayName;
}
