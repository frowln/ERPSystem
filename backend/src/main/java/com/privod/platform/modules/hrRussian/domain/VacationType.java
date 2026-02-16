package com.privod.platform.modules.hrRussian.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum VacationType {

    ЕЖЕГОДНЫЙ("Ежегодный оплачиваемый"),
    ДОПОЛНИТЕЛЬНЫЙ("Дополнительный"),
    БЕЗ_СОДЕРЖАНИЯ("Без сохранения заработной платы"),
    УЧЕБНЫЙ("Учебный"),
    ДЕКРЕТНЫЙ("Декретный (по беременности и родам)");

    private final String displayName;
}
