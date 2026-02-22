package com.privod.platform.modules.finance.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ProjectSectionCatalog {
    PZ("ПЗ", "Пояснительная записка", 10),
    PZU("ПЗУ", "Схема планировочной организации", 20),
    AR("АР", "Архитектурные решения", 30),
    KR("КР", "Конструктивные решения", 40),
    EO("ЭО", "Электроосвещение", 50),
    EM("ЭМ", "Силовое электрооборудование", 60),
    OV("ОВ", "Отопление и вентиляция", 70),
    VK("ВК", "Водоснабжение и канализация", 80),
    SS("СС", "Сети связи", 90),
    GS("ГС", "Газоснабжение", 100),
    PB("ПБ", "Пожарная безопасность", 110),
    POS("ПОС", "Проект организации строительства", 120),
    OOS("ООС", "Охрана окружающей среды", 130);

    private final String code;
    private final String name;
    private final int sequence;
}
