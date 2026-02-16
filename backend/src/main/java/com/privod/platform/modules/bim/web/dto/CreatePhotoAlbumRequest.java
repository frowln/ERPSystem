package com.privod.platform.modules.bim.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreatePhotoAlbumRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Название альбома обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        String description,
        UUID coverPhotoId
) {
}
