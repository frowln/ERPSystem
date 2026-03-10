package com.privod.platform.modules.estimate.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Line type within a Local Estimate (LSR).
 * Defines the 4-level hierarchy: Section > Position > Resource > Summary.
 */
@Getter
@RequiredArgsConstructor
public enum LineType {

    SECTION("Раздел"),
    POSITION("Позиция"),
    RESOURCE("Ресурс"),
    SUMMARY("Итог");

    private final String displayName;
}
