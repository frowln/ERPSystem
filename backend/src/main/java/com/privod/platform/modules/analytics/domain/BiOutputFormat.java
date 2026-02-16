package com.privod.platform.modules.analytics.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BiOutputFormat {

    PDF("PDF"),
    EXCEL("Excel"),
    CSV("CSV"),
    HTML("HTML");

    private final String displayName;
}
