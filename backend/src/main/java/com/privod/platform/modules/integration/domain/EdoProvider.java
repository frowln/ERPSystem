package com.privod.platform.modules.integration.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EdoProvider {

    DIADOC("Диадок"),
    KONTUR("Контур"),
    SBIS("СБИС");

    private final String displayName;
}
