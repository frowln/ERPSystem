package com.privod.platform.modules.integration.telegram.web.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Incoming webhook payload model from Telegram Bot API.
 * See: https://core.telegram.org/bots/api#update
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record TelegramUpdate(
        @JsonProperty("update_id")
        Long updateId,

        @JsonProperty("message")
        TelegramApiMessage message
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TelegramApiMessage(
            @JsonProperty("message_id")
            Long messageId,

            @JsonProperty("from")
            TelegramUser from,

            @JsonProperty("chat")
            TelegramChat chat,

            @JsonProperty("date")
            Long date,

            @JsonProperty("text")
            String text
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TelegramUser(
            @JsonProperty("id")
            Long id,

            @JsonProperty("is_bot")
            Boolean isBot,

            @JsonProperty("first_name")
            String firstName,

            @JsonProperty("last_name")
            String lastName,

            @JsonProperty("username")
            String username
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TelegramChat(
            @JsonProperty("id")
            Long id,

            @JsonProperty("type")
            String type,

            @JsonProperty("title")
            String title,

            @JsonProperty("first_name")
            String firstName,

            @JsonProperty("last_name")
            String lastName
    ) {
    }
}
