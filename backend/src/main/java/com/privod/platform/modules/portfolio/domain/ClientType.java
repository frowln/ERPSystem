package com.privod.platform.modules.portfolio.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ClientType {

    DEVELOPER("Девелопер"),
    GOVERNMENT("Государственный заказчик"),
    INDUSTRIAL("Промышленный"),
    COMMERCIAL("Коммерческий"),
    RESIDENTIAL("Жилищный"),
    INFRASTRUCTURE("Инфраструктурный");

    private final String displayName;
}
