package com.privod.platform.infrastructure.security;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Сервис шифрования чувствительных полей на уровне приложения.
 * Использует AES-256-GCM с уникальным IV для каждой операции шифрования.
 *
 * Формат зашифрованного значения (Base64):
 *   [12 байт IV][зашифрованные данные + 16 байт GCM auth tag]
 */
@Service
@Slf4j
public class FieldEncryptionService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;       // 96 бит — рекомендация NIST для GCM
    private static final int GCM_TAG_LENGTH = 128;      // бит
    private static final int AES_KEY_LENGTH = 32;       // 256 бит

    private final SecretKey secretKey;
    private final SecureRandom secureRandom = new SecureRandom();
    private final String rawFieldKey;

    public FieldEncryptionService(
            @Value("${app.encryption.field-key}") String fieldKey) {
        this.rawFieldKey = fieldKey;
        byte[] keyBytes = normalizeKey(fieldKey);
        this.secretKey = new SecretKeySpec(keyBytes, "AES");
        log.info("FieldEncryptionService initialized (AES-256-GCM)");
    }

    @PostConstruct
    void validateKey() {
        if (rawFieldKey.equals("0123456789abcdef0123456789abcdef")) {
            log.warn("⚠️ FIELD_ENCRYPTION_KEY is using the default value. Set a unique key in production!");
        }
        if (rawFieldKey.length() < 32) {
            log.warn("⚠️ FIELD_ENCRYPTION_KEY is shorter than 32 bytes. Use a 32-character key in production!");
        }
    }

    /**
     * Шифрует открытый текст.
     *
     * @param plaintext открытый текст
     * @return Base64-encoded строка: IV + ciphertext + GCM tag
     */
    public String encrypt(String plaintext) {
        if (plaintext == null) {
            return null;
        }
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec);

            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            // Формат: IV || ciphertext (включает GCM auth tag)
            byte[] combined = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new FieldEncryptionException("Ошибка шифрования поля", e);
        }
    }

    /**
     * Расшифровывает зашифрованный текст.
     *
     * @param ciphertext Base64-encoded строка (IV + ciphertext + GCM tag)
     * @return открытый текст
     */
    public String decrypt(String ciphertext) {
        if (ciphertext == null) {
            return null;
        }
        try {
            byte[] combined = Base64.getDecoder().decode(ciphertext);

            if (combined.length < GCM_IV_LENGTH) {
                throw new FieldEncryptionException("Некорректный формат зашифрованных данных: слишком короткий");
            }

            byte[] iv = new byte[GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, GCM_IV_LENGTH);

            byte[] encrypted = new byte[combined.length - GCM_IV_LENGTH];
            System.arraycopy(combined, GCM_IV_LENGTH, encrypted, 0, encrypted.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);

            byte[] decrypted = cipher.doFinal(encrypted);
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (FieldEncryptionException e) {
            throw e;
        } catch (Exception e) {
            throw new FieldEncryptionException("Ошибка расшифровки поля", e);
        }
    }

    /**
     * Нормализует ключ до 32 байт (AES-256).
     * Если ключ короче — дополняется нулевыми байтами (с предупреждением).
     * Если длиннее — обрезается до 32 байт.
     */
    private byte[] normalizeKey(String key) {
        byte[] raw = key.getBytes(StandardCharsets.UTF_8);
        if (raw.length < AES_KEY_LENGTH) {
            log.warn("Ключ шифрования короче 32 байт ({} байт). "
                    + "Используйте 32-символьный ключ в production!", raw.length);
            byte[] padded = new byte[AES_KEY_LENGTH];
            System.arraycopy(raw, 0, padded, 0, raw.length);
            return padded;
        }
        if (raw.length > AES_KEY_LENGTH) {
            byte[] trimmed = new byte[AES_KEY_LENGTH];
            System.arraycopy(raw, 0, trimmed, 0, AES_KEY_LENGTH);
            return trimmed;
        }
        return raw;
    }

    /**
     * Исключение при ошибках шифрования/дешифрования.
     */
    public static class FieldEncryptionException extends RuntimeException {
        public FieldEncryptionException(String message) {
            super(message);
        }

        public FieldEncryptionException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
