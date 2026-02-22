package com.privod.platform.modules.ai.classification.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DocumentClassType {

    KS2("КС-2"),
    KS3("КС-3"),
    AOSR("АОСР"),
    DRAWING("Чертёж"),
    ESTIMATE("Смета"),
    ACT("Акт"),
    INVOICE("Счёт-фактура"),
    WAYBILL("Накладная"),
    CONTRACT("Договор"),
    OTHER("Прочее");

    private final String displayName;
}
