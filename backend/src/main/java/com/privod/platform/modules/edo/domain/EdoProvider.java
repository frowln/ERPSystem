package com.privod.platform.modules.edo.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EdoProvider {

    DIADOK("Диадок"),
    SBIS("СБИС"),
    KONTUR("Контур");

    private final String displayName;
}
