package com.privod.platform.modules.settings.web.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.modules.settings.domain.CustomFieldDefinition;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CustomFieldDefinitionResponse(
        UUID id,
        String entityType,
        String fieldKey,
        String fieldName,
        String fieldType,
        String description,
        boolean required,
        boolean searchable,
        int sortOrder,
        List<String> options,
        String defaultValue,
        String validationRegex,
        Instant createdAt
) {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static CustomFieldDefinitionResponse fromEntity(CustomFieldDefinition entity) {
        List<String> parsedOptions = null;
        if (entity.getOptions() != null) {
            try {
                parsedOptions = MAPPER.readValue(entity.getOptions(), new TypeReference<List<String>>() {});
            } catch (Exception e) {
                parsedOptions = List.of();
            }
        }

        return new CustomFieldDefinitionResponse(
                entity.getId(),
                entity.getEntityType(),
                entity.getFieldKey(),
                entity.getFieldName(),
                entity.getFieldType().name(),
                entity.getDescription(),
                entity.isRequired(),
                entity.isSearchable(),
                entity.getSortOrder(),
                parsedOptions,
                entity.getDefaultValue(),
                entity.getValidationRegex(),
                entity.getCreatedAt()
        );
    }
}
