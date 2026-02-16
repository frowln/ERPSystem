package com.privod.platform.modules.analytics.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum XyzCategory {

    X("Категория X (стабильное потребление)"),
    Y("Категория Y (переменное потребление)"),
    Z("Категория Z (нерегулярное потребление)");

    private final String displayName;
}
