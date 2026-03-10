package com.privod.platform.modules.email.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.email.yandex")
@Getter
@Setter
public class EmailImapSmtpConfig {

    private ImapConfig imap = new ImapConfig();
    private SmtpConfig smtp = new SmtpConfig();

    @Getter
    @Setter
    public static class ImapConfig {
        private String host = "imap.yandex.ru";
        private int port = 993;
        private String username = "office@privod-electro.ru";
        private String password;
        private boolean ssl = true;
        private long syncIntervalMs = 120000;
        private int maxFetch = 200;
        private int initialFetch = 500;
    }

    @Getter
    @Setter
    public static class SmtpConfig {
        private String host = "smtp.yandex.ru";
        private int port = 465;
        private String username = "office@privod-electro.ru";
        private String password;
        private boolean ssl = true;
    }
}
