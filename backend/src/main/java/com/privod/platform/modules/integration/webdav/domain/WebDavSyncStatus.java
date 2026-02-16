package com.privod.platform.modules.integration.webdav.domain;

public enum WebDavSyncStatus {

    SYNCED("Синхронизирован"),
    PENDING_UPLOAD("Ожидает загрузки"),
    PENDING_DOWNLOAD("Ожидает скачивания"),
    CONFLICT("Конфликт"),
    ERROR("Ошибка");

    private final String displayName;

    WebDavSyncStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
