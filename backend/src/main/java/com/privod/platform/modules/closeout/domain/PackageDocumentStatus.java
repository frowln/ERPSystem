package com.privod.platform.modules.closeout.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PackageDocumentStatus {

    INCLUDED("Включён"),
    EXCLUDED("Исключён"),
    MISSING("Отсутствует");

    private final String displayName;
}
