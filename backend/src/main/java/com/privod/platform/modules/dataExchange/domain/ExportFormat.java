package com.privod.platform.modules.dataExchange.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ExportFormat {

    CSV("CSV"),
    XLSX("Excel"),
    PDF("PDF"),
    JSON("JSON"),
    XML("XML");

    private final String displayName;
}
