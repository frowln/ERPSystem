package com.privod.platform.modules.hrRussian.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SalaryType {

    ОКЛАД("Оклад (месячный)"),
    ЧАСОВАЯ("Часовая ставка"),
    СДЕЛЬНАЯ("Сдельная оплата");

    private final String displayName;
}
