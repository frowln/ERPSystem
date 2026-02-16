package com.privod.platform.modules.integration.sms.domain;

public enum SmsProvider {

    SMSC_RU("SMSC.ru"),
    SMS_AERO("SMS Aero"),
    TWILIO("Twilio"),
    WHATSAPP_BUSINESS("WhatsApp Business");

    private final String displayName;

    SmsProvider(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
