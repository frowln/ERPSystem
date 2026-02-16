package com.privod.platform.modules.report.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PaperSize {

    A4("А4"),
    A3("А3"),
    LETTER("Letter");

    private final String displayName;
}
