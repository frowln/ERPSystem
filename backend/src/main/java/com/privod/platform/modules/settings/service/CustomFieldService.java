package com.privod.platform.modules.settings.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.modules.settings.domain.CustomFieldDefinition;
import com.privod.platform.modules.settings.domain.CustomFieldType;
import com.privod.platform.modules.settings.domain.CustomFieldValue;
import com.privod.platform.modules.settings.repository.CustomFieldDefinitionRepository;
import com.privod.platform.modules.settings.repository.CustomFieldValueRepository;
import com.privod.platform.modules.settings.web.dto.CreateCustomFieldRequest;
import com.privod.platform.modules.settings.web.dto.CustomFieldDefinitionResponse;
import com.privod.platform.modules.settings.web.dto.CustomFieldValueRequest;
import com.privod.platform.modules.settings.web.dto.CustomFieldValueResponse;
import com.privod.platform.modules.settings.web.dto.UpdateCustomFieldRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomFieldService {

    private final CustomFieldDefinitionRepository definitionRepository;
    private final CustomFieldValueRepository valueRepository;
    private final ObjectMapper objectMapper;

    // ─── Definitions ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CustomFieldDefinitionResponse> getDefinitions(UUID organizationId, String entityType) {
        return definitionRepository
                .findByOrganizationIdAndEntityTypeAndDeletedFalseOrderBySortOrder(organizationId, entityType)
                .stream()
                .map(CustomFieldDefinitionResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, List<CustomFieldDefinitionResponse>> getAllDefinitions(UUID organizationId) {
        List<CustomFieldDefinition> all = definitionRepository
                .findByOrganizationIdAndDeletedFalseOrderByEntityTypeAscSortOrderAsc(organizationId);

        Map<String, List<CustomFieldDefinitionResponse>> grouped = new LinkedHashMap<>();
        for (CustomFieldDefinition def : all) {
            grouped.computeIfAbsent(def.getEntityType(), k -> new ArrayList<>())
                    .add(CustomFieldDefinitionResponse.fromEntity(def));
        }
        return grouped;
    }

    @Transactional
    public CustomFieldDefinitionResponse createDefinition(UUID organizationId, CreateCustomFieldRequest request) {
        CustomFieldType fieldType;
        try {
            fieldType = CustomFieldType.valueOf(request.fieldType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Неподдерживаемый тип поля: " + request.fieldType());
        }

        String fieldKey = generateFieldKey(request.fieldName());

        // Ensure uniqueness — append suffix if key already exists
        String baseKey = fieldKey;
        int suffix = 1;
        while (definitionRepository.existsByOrganizationIdAndEntityTypeAndFieldKeyAndDeletedFalse(
                organizationId, request.entityType().toUpperCase(), fieldKey)) {
            fieldKey = baseKey + "_" + suffix;
            suffix++;
        }

        String optionsJson = null;
        if (request.options() != null && !request.options().isEmpty()) {
            try {
                optionsJson = objectMapper.writeValueAsString(request.options());
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("Ошибка сериализации вариантов выбора");
            }
        }

        CustomFieldDefinition definition = CustomFieldDefinition.builder()
                .organizationId(organizationId)
                .entityType(request.entityType().toUpperCase())
                .fieldKey(fieldKey)
                .fieldName(request.fieldName())
                .fieldType(fieldType)
                .description(request.description())
                .required(request.required() != null ? request.required() : false)
                .searchable(request.searchable() != null ? request.searchable() : false)
                .options(optionsJson)
                .defaultValue(request.defaultValue())
                .validationRegex(request.validationRegex())
                .build();

        definition = definitionRepository.save(definition);
        log.info("Custom field definition created: {} / {} / {} ({})",
                organizationId, request.entityType(), fieldKey, definition.getId());

        return CustomFieldDefinitionResponse.fromEntity(definition);
    }

    @Transactional
    public CustomFieldDefinitionResponse updateDefinition(UUID id, UpdateCustomFieldRequest request) {
        CustomFieldDefinition definition = definitionRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Определение пользовательского поля не найдено: " + id));

        if (request.fieldName() != null) {
            definition.setFieldName(request.fieldName());
        }
        if (request.description() != null) {
            definition.setDescription(request.description());
        }
        if (request.required() != null) {
            definition.setRequired(request.required());
        }
        if (request.searchable() != null) {
            definition.setSearchable(request.searchable());
        }
        if (request.sortOrder() != null) {
            definition.setSortOrder(request.sortOrder());
        }
        if (request.options() != null) {
            try {
                definition.setOptions(objectMapper.writeValueAsString(request.options()));
            } catch (JsonProcessingException e) {
                throw new IllegalArgumentException("Ошибка сериализации вариантов выбора");
            }
        }
        if (request.defaultValue() != null) {
            definition.setDefaultValue(request.defaultValue());
        }
        if (request.validationRegex() != null) {
            definition.setValidationRegex(request.validationRegex());
        }

        definition = definitionRepository.save(definition);
        log.info("Custom field definition updated: {} ({})", definition.getFieldKey(), id);

        return CustomFieldDefinitionResponse.fromEntity(definition);
    }

    @Transactional
    public void deleteDefinition(UUID id) {
        CustomFieldDefinition definition = definitionRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Определение пользовательского поля не найдено: " + id));

        definition.softDelete();
        definitionRepository.save(definition);

        // Soft-delete all associated values
        valueRepository.softDeleteByDefinitionId(id);

        log.info("Custom field definition deleted: {} / {} ({})",
                definition.getEntityType(), definition.getFieldKey(), id);
    }

    // ─── Values ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CustomFieldValueResponse> getValues(String entityType, UUID entityId) {
        List<CustomFieldValue> values = valueRepository
                .findByEntityTypeAndEntityIdAndDeletedFalse(entityType.toUpperCase(), entityId);

        List<CustomFieldValueResponse> result = new ArrayList<>();
        for (CustomFieldValue val : values) {
            CustomFieldDefinition def = definitionRepository.findByIdAndDeletedFalse(val.getDefinitionId())
                    .orElse(null);
            if (def == null) {
                continue; // orphaned value — definition was deleted
            }
            result.add(new CustomFieldValueResponse(
                    def.getId(),
                    def.getFieldKey(),
                    def.getFieldName(),
                    def.getFieldType().name(),
                    extractValue(val, def.getFieldType()),
                    def.getEntityType()
            ));
        }
        return result;
    }

    @Transactional
    public List<CustomFieldValueResponse> saveValues(UUID organizationId, String entityType, UUID entityId,
                                                      List<CustomFieldValueRequest> requests) {
        String normalizedEntityType = entityType.toUpperCase();
        List<CustomFieldValueResponse> result = new ArrayList<>();

        for (CustomFieldValueRequest req : requests) {
            CustomFieldDefinition definition = definitionRepository.findByIdAndDeletedFalse(req.definitionId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Определение пользовательского поля не найдено: " + req.definitionId()));

            // Validate that definition belongs to this org and entity type
            if (!definition.getOrganizationId().equals(organizationId)) {
                throw new IllegalArgumentException(
                        "Поле не принадлежит организации: " + req.definitionId());
            }
            if (!definition.getEntityType().equals(normalizedEntityType)) {
                throw new IllegalArgumentException(
                        "Тип сущности не совпадает для поля: " + definition.getFieldKey());
            }

            // Validate value
            validateValue(definition, req.value());

            // Upsert
            CustomFieldValue value = valueRepository
                    .findByDefinitionIdAndEntityIdAndDeletedFalse(req.definitionId(), entityId)
                    .orElseGet(() -> CustomFieldValue.builder()
                            .organizationId(organizationId)
                            .definitionId(req.definitionId())
                            .entityType(normalizedEntityType)
                            .entityId(entityId)
                            .build());

            // Clear all value columns
            value.setValueText(null);
            value.setValueNumber(null);
            value.setValueDate(null);
            value.setValueBoolean(null);
            value.setValueJson(null);

            // Set the appropriate column
            setValueColumn(value, definition.getFieldType(), req.value());

            value = valueRepository.save(value);

            result.add(new CustomFieldValueResponse(
                    definition.getId(),
                    definition.getFieldKey(),
                    definition.getFieldName(),
                    definition.getFieldType().name(),
                    extractValue(value, definition.getFieldType()),
                    definition.getEntityType()
            ));
        }

        return result;
    }

    // ─── Internal helpers ───────────────────────────────────────────

    private void validateValue(CustomFieldDefinition definition, Object value) {
        // Required check
        if (definition.isRequired() && (value == null || value.toString().isBlank())) {
            throw new IllegalArgumentException(
                    "Поле '" + definition.getFieldName() + "' обязательно для заполнения");
        }

        if (value == null) {
            return;
        }

        // Regex check (for TEXT, URL, EMAIL types)
        if (definition.getValidationRegex() != null && !definition.getValidationRegex().isBlank()) {
            String strValue = value.toString();
            if (!Pattern.matches(definition.getValidationRegex(), strValue)) {
                throw new IllegalArgumentException(
                        "Значение поля '" + definition.getFieldName() + "' не соответствует формату");
            }
        }

        // Type-specific validation
        switch (definition.getFieldType()) {
            case NUMBER -> {
                if (!(value instanceof Number)) {
                    try {
                        Double.parseDouble(value.toString());
                    } catch (NumberFormatException e) {
                        throw new IllegalArgumentException(
                                "Поле '" + definition.getFieldName() + "' должно быть числом");
                    }
                }
            }
            case BOOLEAN -> {
                if (!(value instanceof Boolean)) {
                    String s = value.toString().toLowerCase();
                    if (!s.equals("true") && !s.equals("false")) {
                        throw new IllegalArgumentException(
                                "Поле '" + definition.getFieldName() + "' должно быть логическим значением");
                    }
                }
            }
            case SELECT -> {
                if (definition.getOptions() != null) {
                    List<String> options = parseOptions(definition.getOptions());
                    if (!options.contains(value.toString())) {
                        throw new IllegalArgumentException(
                                "Недопустимое значение для поля '" + definition.getFieldName()
                                        + "'. Допустимые: " + options);
                    }
                }
            }
            case MULTISELECT -> {
                if (definition.getOptions() != null && value instanceof List<?> selectedValues) {
                    List<String> options = parseOptions(definition.getOptions());
                    for (Object sel : selectedValues) {
                        if (!options.contains(sel.toString())) {
                            throw new IllegalArgumentException(
                                    "Недопустимое значение '" + sel + "' для поля '"
                                            + definition.getFieldName() + "'");
                        }
                    }
                }
            }
            case DATE -> {
                // Accept ISO-8601 strings or epoch millis
                if (!(value instanceof Number)) {
                    try {
                        Instant.parse(value.toString());
                    } catch (Exception e) {
                        throw new IllegalArgumentException(
                                "Поле '" + definition.getFieldName()
                                        + "' должно быть датой в формате ISO-8601");
                    }
                }
            }
            default -> {
                // TEXT, URL, EMAIL — no additional type check beyond regex
            }
        }
    }

    private void setValueColumn(CustomFieldValue value, CustomFieldType fieldType, Object rawValue) {
        if (rawValue == null) {
            return;
        }

        switch (fieldType) {
            case TEXT, URL, EMAIL, SELECT -> value.setValueText(rawValue.toString());
            case NUMBER -> {
                if (rawValue instanceof Number num) {
                    value.setValueNumber(num.doubleValue());
                } else {
                    value.setValueNumber(Double.parseDouble(rawValue.toString()));
                }
            }
            case DATE -> {
                if (rawValue instanceof Number num) {
                    value.setValueDate(Instant.ofEpochMilli(num.longValue()));
                } else {
                    value.setValueDate(Instant.parse(rawValue.toString()));
                }
            }
            case BOOLEAN -> {
                if (rawValue instanceof Boolean b) {
                    value.setValueBoolean(b);
                } else {
                    value.setValueBoolean(Boolean.parseBoolean(rawValue.toString()));
                }
            }
            case MULTISELECT -> {
                try {
                    value.setValueJson(objectMapper.writeValueAsString(rawValue));
                } catch (JsonProcessingException e) {
                    throw new IllegalArgumentException("Ошибка сериализации значения MULTISELECT");
                }
            }
        }
    }

    private Object extractValue(CustomFieldValue value, CustomFieldType fieldType) {
        return switch (fieldType) {
            case TEXT, URL, EMAIL, SELECT -> value.getValueText();
            case NUMBER -> value.getValueNumber();
            case DATE -> value.getValueDate();
            case BOOLEAN -> value.getValueBoolean();
            case MULTISELECT -> {
                if (value.getValueJson() != null) {
                    try {
                        yield objectMapper.readValue(value.getValueJson(), new TypeReference<List<String>>() {});
                    } catch (JsonProcessingException e) {
                        yield List.of();
                    }
                }
                yield List.of();
            }
        };
    }

    private List<String> parseOptions(String optionsJson) {
        try {
            return objectMapper.readValue(optionsJson, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    /**
     * Generates a snake_case field key from a human-readable name.
     * Supports both Latin and Cyrillic input.
     * Examples: "Номер договора" → "nomer_dogovora", "Project Phase" → "project_phase"
     */
    private String generateFieldKey(String name) {
        if (name == null || name.isBlank()) {
            return "field_" + UUID.randomUUID().toString().substring(0, 8);
        }

        // Transliterate Cyrillic to Latin
        String transliterated = transliterate(name);

        // Normalize and strip accents
        String normalized = Normalizer.normalize(transliterated, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");

        // Convert to lowercase, replace non-alphanumeric with underscore, collapse
        String key = normalized.toLowerCase()
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("^_+|_+$", "");

        if (key.isEmpty()) {
            return "field_" + UUID.randomUUID().toString().substring(0, 8);
        }

        // Limit length
        if (key.length() > 80) {
            key = key.substring(0, 80).replaceAll("_+$", "");
        }

        return key;
    }

    private static final Map<Character, String> CYRILLIC_MAP = Map.ofEntries(
            Map.entry('а', "a"), Map.entry('б', "b"), Map.entry('в', "v"),
            Map.entry('г', "g"), Map.entry('д', "d"), Map.entry('е', "e"),
            Map.entry('ё', "yo"), Map.entry('ж', "zh"), Map.entry('з', "z"),
            Map.entry('и', "i"), Map.entry('й', "y"), Map.entry('к', "k"),
            Map.entry('л', "l"), Map.entry('м', "m"), Map.entry('н', "n"),
            Map.entry('о', "o"), Map.entry('п', "p"), Map.entry('р', "r"),
            Map.entry('с', "s"), Map.entry('т', "t"), Map.entry('у', "u"),
            Map.entry('ф', "f"), Map.entry('х', "kh"), Map.entry('ц', "ts"),
            Map.entry('ч', "ch"), Map.entry('ш', "sh"), Map.entry('щ', "shch"),
            Map.entry('ъ', ""), Map.entry('ы', "y"), Map.entry('ь', ""),
            Map.entry('э', "e"), Map.entry('ю', "yu"), Map.entry('я', "ya")
    );

    private String transliterate(String text) {
        StringBuilder sb = new StringBuilder();
        for (char c : text.toCharArray()) {
            char lower = Character.toLowerCase(c);
            String replacement = CYRILLIC_MAP.get(lower);
            if (replacement != null) {
                if (Character.isUpperCase(c) && !replacement.isEmpty()) {
                    sb.append(Character.toUpperCase(replacement.charAt(0)));
                    sb.append(replacement.substring(1));
                } else {
                    sb.append(replacement);
                }
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }
}
