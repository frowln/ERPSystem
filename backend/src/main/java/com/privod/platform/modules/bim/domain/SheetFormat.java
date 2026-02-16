package com.privod.platform.modules.bim.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SheetFormat {

    A0("A0"),
    A1("A1"),
    A2("A2"),
    A3("A3"),
    A4("A4");

    private final String displayName;
}
