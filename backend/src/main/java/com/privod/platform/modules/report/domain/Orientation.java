package com.privod.platform.modules.report.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Orientation {

    PORTRAIT("Книжная"),
    LANDSCAPE("Альбомная");

    private final String displayName;
}
