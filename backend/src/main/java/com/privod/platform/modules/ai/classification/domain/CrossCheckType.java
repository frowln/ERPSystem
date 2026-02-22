package com.privod.platform.modules.ai.classification.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CrossCheckType {

    QUANTITY_MATCH("Соответствие объёмов"),
    PRICE_MATCH("Соответствие цен"),
    TOTAL_MATCH("Соответствие итогов"),
    SIGNATURE_MATCH("Соответствие подписей"),
    DATE_MATCH("Соответствие дат");

    private final String displayName;
}
