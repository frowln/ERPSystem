package com.privod.platform.modules.integration.govregistries.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RegistryType {

    EGRUL("Единый государственный реестр юридических лиц"),
    FNS("Федеральная налоговая служба (проверка задолженности)"),
    RNPO("Реестр недобросовестных поставщиков"),
    EFRSB("Единый федеральный реестр сведений о банкротстве"),
    RSMP("Реестр субъектов малого и среднего предпринимательства");

    private final String displayName;
}
