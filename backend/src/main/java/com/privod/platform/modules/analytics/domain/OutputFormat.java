package com.privod.platform.modules.analytics.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum OutputFormat {

    PDF("PDF"),
    EXCEL("Excel"),
    CSV("CSV");

    private final String displayName;
}
