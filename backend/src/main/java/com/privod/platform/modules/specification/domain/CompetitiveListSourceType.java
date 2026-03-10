package com.privod.platform.modules.specification.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Source type for competitive lists.
 * SPECIFICATION — material/equipment from project specification (supplier tender).
 * ESTIMATE — works from LSR estimate (contractor tender).
 */
@Getter
@RequiredArgsConstructor
public enum CompetitiveListSourceType {

    SPECIFICATION("Спецификация"),
    ESTIMATE("Смета");

    private final String displayName;
}
