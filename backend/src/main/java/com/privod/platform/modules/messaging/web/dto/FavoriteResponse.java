package com.privod.platform.modules.messaging.web.dto;

import com.privod.platform.modules.messaging.domain.MessageFavorite;

import java.time.Instant;
import java.util.UUID;

public record FavoriteResponse(
        UUID id,
        UUID messageId,
        UUID userId,
        String note,
        Instant createdAt,
        String channelName,
        MessageResponse message
) {
    public static FavoriteResponse fromEntity(
            MessageFavorite favorite,
            String channelName,
            MessageResponse message
    ) {
        return new FavoriteResponse(
                favorite.getId(),
                favorite.getMessageId(),
                favorite.getUserId(),
                favorite.getNote(),
                favorite.getCreatedAt(),
                channelName,
                message
        );
    }
}
