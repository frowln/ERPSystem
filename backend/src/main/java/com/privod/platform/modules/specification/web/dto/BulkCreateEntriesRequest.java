package com.privod.platform.modules.specification.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record BulkCreateEntriesRequest(
        @NotEmpty(message = "Список записей не может быть пустым")
        @Valid
        List<CreateCompetitiveListEntryRequest> entries
) {
}
