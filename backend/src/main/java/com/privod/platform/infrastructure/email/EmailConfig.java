package com.privod.platform.infrastructure.email;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.spring6.templateresolver.SpringResourceTemplateResolver;
import org.thymeleaf.templatemode.TemplateMode;

import java.nio.charset.StandardCharsets;

/**
 * Configuration for email template resolution.
 * The {@link org.springframework.mail.javamail.JavaMailSender} bean is
 * auto-configured by Spring Boot from {@code spring.mail.*} properties.
 */
@Configuration
public class EmailConfig {

    @Value("${app.email.from-address:noreply@privod.ru}")
    private String fromAddress;

    @Value("${app.email.from-name:Привод - Строительная ERP}")
    private String fromName;

    @Value("${app.email.base-url:http://localhost:3000}")
    private String baseUrl;

    @Bean
    public EmailProperties emailProperties() {
        return new EmailProperties(fromAddress, fromName, baseUrl);
    }

    public record EmailProperties(String fromAddress, String fromName, String baseUrl) {}
}
