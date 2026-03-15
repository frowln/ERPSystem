package com.privod.platform.modules.warehouse.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record BulkImportMaterialRequest(
        @NotEmpty(message = "Список материалов не может быть пустым")
        @Valid
        List<CreateMaterialRequest> items
) {
}
