package com.privod.platform.modules.auth.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateOidcProviderRequest(
        @NotBlank(message = "Код провайдера обязателен")
        @Size(max = 50, message = "Код провайдера не должен превышать 50 символов")
        String code,

        @NotBlank(message = "Название провайдера обязательно")
        @Size(max = 255, message = "Название провайдера не должно превышать 255 символов")
        String name,

        @NotBlank(message = "Client ID обязателен")
        String clientId,

        @NotBlank(message = "Client Secret обязателен")
        String clientSecret,

        @NotBlank(message = "URL авторизации обязателен")
        String authorizationUrl,

        @NotBlank(message = "URL получения токена обязателен")
        String tokenUrl,

        String userInfoUrl,
        String scope,
        String iconUrl
) {
}
