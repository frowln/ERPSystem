package com.privod.platform.modules.portal.domain;

public enum SignatureStatus {
    PENDING("Ожидает подписания"),
    SIGNED("Подписан"),
    REJECTED("Отклонён"),
    EXPIRED("Срок истёк");

    private final String displayName;

    SignatureStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
