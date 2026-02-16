package com.privod.platform.modules.bim.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ClashType {

    HARD("Жёсткая коллизия"),
    SOFT("Мягкая коллизия"),
    CLEARANCE("Нарушение зазора");

    private final String displayName;
}
