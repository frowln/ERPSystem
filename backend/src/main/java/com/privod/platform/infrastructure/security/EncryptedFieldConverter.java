package com.privod.platform.infrastructure.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.stereotype.Component;

/**
 * JPA AttributeConverter для автоматического шифрования/расшифровки
 * чувствительных строковых полей в БД.
 *
 * Использование:
 * <pre>
 * {@code @Convert(converter = EncryptedFieldConverter.class)}
 * {@code @Column(name = "inn", length = 255)}  // увеличить length для зашифрованных данных
 * private String inn;
 * </pre>
 *
 * ВАЖНО: при включении шифрования на существующих полях необходима
 * миграция данных (см. docs/ENCRYPTION.md).
 */
@Converter
@Component
public class EncryptedFieldConverter implements AttributeConverter<String, String> {

    private static FieldEncryptionService encryptionService;

    /**
     * Конструктор для Spring DI — инжектирует сервис шифрования.
     * JPA создаёт экземпляры конвертера через no-arg конструктор,
     * поэтому сервис хранится в статическом поле.
     */
    public EncryptedFieldConverter(FieldEncryptionService service) {
        EncryptedFieldConverter.encryptionService = service;
    }

    /**
     * No-arg конструктор для JPA.
     */
    public EncryptedFieldConverter() {
        // JPA requires no-arg constructor
    }

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || encryptionService == null) {
            return attribute;
        }
        return encryptionService.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || encryptionService == null) {
            return dbData;
        }
        // Если данные не зашифрованы (legacy), возвращаем как есть
        try {
            return encryptionService.decrypt(dbData);
        } catch (FieldEncryptionService.FieldEncryptionException e) {
            // Данные в открытом виде (до миграции) — возвращаем без расшифровки
            return dbData;
        }
    }
}
