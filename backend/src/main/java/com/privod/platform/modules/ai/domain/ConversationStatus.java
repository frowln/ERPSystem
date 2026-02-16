package com.privod.platform.modules.ai.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ConversationStatus {
    ACTIVE("Активный"),
    ARCHIVED("Архивный");

    private final String displayName;
}
