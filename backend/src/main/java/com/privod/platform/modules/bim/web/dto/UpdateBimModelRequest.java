package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.BimModelFormat;
import com.privod.platform.modules.bim.domain.BimModelStatus;
import com.privod.platform.modules.bim.domain.BimModelType;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateBimModelRequest(
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        BimModelType modelType,
        BimModelFormat format,
        String fileUrl,
        Long fileSize,
        String description,
        BimModelStatus status,
        UUID uploadedById,
        Integer elementCount
) {
}
