package com.privod.platform.modules.cde.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DocumentClassification {

    DESIGN("Проектная документация"),
    CONSTRUCTION("Строительная документация"),
    COMMISSIONING("Пусконаладка"),
    ADMINISTRATIVE("Административная"),
    CONTRACTUAL("Договорная"),
    REGULATORY("Нормативная");

    private final String displayName;
}
