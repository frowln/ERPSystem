package com.privod.platform.modules.pto.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SubmittalType {

    SHOP_DRAWING("Рабочий чертёж"),
    PRODUCT_DATA("Данные о материале"),
    SAMPLE("Образец"),
    MOCK_UP("Макет"),
    TEST_REPORT("Протокол испытаний"),
    CERTIFICATE("Сертификат"),
    CALCULATION("Расчёт"),
    DESIGN_MIX("Состав смеси"),
    OTHER("Прочее");

    private final String displayName;
}
