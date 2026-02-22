package com.privod.platform.modules.analytics.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ReportOutputFormat {

    JSON("JSON"),
    PDF("PDF"),
    XLSX("Excel");

    private final String displayName;
}
