package com.privod.platform.modules.bidScoring.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CriteriaType {

    PRICE("Цена"),
    QUALITY("Качество"),
    DELIVERY("Сроки поставки"),
    EXPERIENCE("Опыт"),
    FINANCIAL("Финансовая устойчивость"),
    TECHNICAL("Техническое соответствие"),
    CUSTOM("Пользовательский");

    private final String displayName;
}
