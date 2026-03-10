package com.privod.platform.infrastructure.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI 3.0 configuration for the PRIVOD Platform API.
 * <p>
 * Provides interactive Swagger UI at /swagger-ui and JSON spec at /api-docs.
 * JWT Bearer authentication is declared globally so that the "Authorize" button
 * appears in Swagger UI for all secured endpoints.
 */
@Configuration
public class OpenApiConfig {

    @Value("${app.api.version:1.0.0}")
    private String apiVersion;

    @Bean
    public OpenAPI privodOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("PRIVOD Platform API")
                        .description("Платформа управления строительными проектами. "
                                + "REST API для интеграции с внешними системами, мобильными приложениями "
                                + "и сторонними сервисами (1С, СБИС, ИСУП).")
                        .version(apiVersion)
                        .contact(new Contact()
                                .name("PRIVOD Development Team")
                                .email("api@privod.ru")
                                .url("https://privod.ru"))
                        .license(new License()
                                .name("Proprietary")
                                .url("https://privod.ru/license")))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Auth"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Auth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT токен авторизации. Получите токен через POST /api/auth/login "
                                        + "и передавайте в заголовке Authorization: Bearer <token>")))
                .tags(List.of(
                        new Tag().name("Health").description("Проверка состояния системы и сервисов"),
                        new Tag().name("Projects").description("Управление проектами"),
                        new Tag().name("Tasks").description("Управление задачами"),
                        new Tag().name("Budgets").description("Финансовый модуль — бюджеты и позиции"),
                        new Tag().name("Estimates").description("Сметный модуль"),
                        new Tag().name("Specifications").description("Спецификации и материалы"),
                        new Tag().name("CRM").description("Управление лидами и воронкой продаж"),
                        new Tag().name("Contracts").description("Управление договорами"),
                        new Tag().name("Safety").description("Охрана труда — инциденты и инструктажи"),
                        new Tag().name("Procurement").description("Закупки — заявки и заказы"),
                        new Tag().name("Documents").description("Документооборот и файлы"),
                        new Tag().name("Users").description("Управление пользователями и ролями")
                ))
                .addServersItem(new Server()
                        .url("/")
                        .description("Текущий сервер"));
    }
}
