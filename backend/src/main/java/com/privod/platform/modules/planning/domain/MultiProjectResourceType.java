package com.privod.platform.modules.planning.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum MultiProjectResourceType {

    WORKER("Работник"),
    EQUIPMENT("Техника");

    private final String displayName;
}
