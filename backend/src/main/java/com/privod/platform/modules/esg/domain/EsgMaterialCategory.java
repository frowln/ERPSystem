package com.privod.platform.modules.esg.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EsgMaterialCategory {

    CONCRETE("Бетон"),
    STEEL("Сталь"),
    TIMBER("Древесина"),
    BRICK("Кирпич"),
    GLASS("Стекло"),
    INSULATION("Изоляция"),
    COPPER("Медь"),
    ALUMINUM("Алюминий"),
    PLASTIC("Пластик"),
    ASPHALT("Асфальт"),
    CERAMIC("Керамика"),
    GYPSUM("Гипс"),
    PAINT("Краска"),
    PIPE("Трубы");

    private final String displayName;
}
