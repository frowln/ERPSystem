package com.privod.platform.modules.integration.sms.domain;

public enum SmsChannel {

    SMS("SMS"),
    WHATSAPP("WhatsApp");

    private final String displayName;

    SmsChannel(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
