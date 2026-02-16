package com.privod.platform.modules.pmWorkflow.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SubmittalType {

    SHOP_DRAWING("Рабочие чертежи"),
    PRODUCT_DATA("Данные о материалах"),
    SAMPLE("Образец"),
    MOCK_UP("Макет"),
    DESIGN_MIX("Проект состава смеси"),
    OTHER("Прочее");

    private final String displayName;
}
