package com.privod.platform.modules.integration.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum IntegrationProvider {

    ONE_C("1С"),
    SBERBANK("Сбербанк"),
    TINKOFF("Тинькофф"),
    VTB("ВТБ"),
    ALFA_BANK("Альфа-Банк"),
    RAIFFEISEN("Райффайзен"),
    SBIS("СБИС"),
    EDO_DIADOC("ЭДО Диадок"),
    EDO_KONTUR("ЭДО Контур"),
    CUSTOM("Пользовательский");

    private final String displayName;
}
