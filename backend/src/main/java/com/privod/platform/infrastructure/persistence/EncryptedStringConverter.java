package com.privod.platform.infrastructure.persistence;

import com.privod.platform.modules.settings.service.SettingEncryptionService;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * JPA AttributeConverter that transparently encrypts/decrypts String fields
 * using AES-GCM via {@link SettingEncryptionService}.
 *
 * Usage: annotate sensitive entity fields with
 * {@code @Convert(converter = EncryptedStringConverter.class)}
 *
 * Spring Boot auto-registers this converter because it is both a {@code @Component}
 * and implements {@code AttributeConverter}. Hibernate picks it up from the Spring context.
 */
@Converter
@Component
@Slf4j
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    private final SettingEncryptionService encryptionService;

    public EncryptedStringConverter(SettingEncryptionService encryptionService) {
        this.encryptionService = encryptionService;
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return attribute;
        }
        return encryptionService.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) {
            return dbData;
        }
        try {
            return encryptionService.decrypt(dbData);
        } catch (Exception e) {
            // If decryption fails, the value may be stored in plaintext (pre-migration data).
            // Return as-is and log a warning. A data migration job should re-encrypt these.
            log.warn("Failed to decrypt column value — returning raw value. "
                    + "This may indicate pre-migration plaintext data. Error: {}", e.getMessage());
            return dbData;
        }
    }
}
