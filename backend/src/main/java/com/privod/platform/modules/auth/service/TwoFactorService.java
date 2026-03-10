package com.privod.platform.modules.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Service
@Slf4j
public class TwoFactorService {

    private static final String ISSUER = "Privod";
    private static final int BACKUP_CODE_COUNT = 8;
    private static final int BACKUP_CODE_LENGTH = 8;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final String BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int TOTP_PERIOD = 30;
    private static final int TOTP_DIGITS = 6;
    private static final int TOTP_WINDOW = 1;

    /**
     * Generate a new TOTP secret (Base32-encoded, 32 chars).
     */
    public String generateSecret() {
        byte[] bytes = new byte[20];
        SECURE_RANDOM.nextBytes(bytes);
        return base32Encode(bytes);
    }

    /**
     * Generate the otpauth:// URI for QR code generation.
     */
    public String generateQrCodeUri(String secret, String email) {
        return String.format("otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30",
                ISSUER, email, secret, ISSUER);
    }

    /**
     * Verify a TOTP code against the given secret.
     */
    public boolean verifyCode(String secret, String code) {
        if (secret == null || code == null) {
            return false;
        }
        try {
            long currentInterval = System.currentTimeMillis() / 1000 / TOTP_PERIOD;
            byte[] key = base32Decode(secret);
            for (int i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
                String generated = generateTotpCode(key, currentInterval + i);
                if (generated.equals(code)) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            log.warn("TOTP verification error: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Generate a list of single-use recovery codes.
     */
    public List<String> generateRecoveryCodes() {
        List<String> codes = new ArrayList<>();
        for (int i = 0; i < BACKUP_CODE_COUNT; i++) {
            StringBuilder sb = new StringBuilder(BACKUP_CODE_LENGTH);
            for (int j = 0; j < BACKUP_CODE_LENGTH; j++) {
                sb.append(ALPHANUMERIC.charAt(SECURE_RANDOM.nextInt(ALPHANUMERIC.length())));
            }
            codes.add(sb.toString());
        }
        return codes;
    }

    private String generateTotpCode(byte[] key, long interval) throws Exception {
        byte[] data = ByteBuffer.allocate(8).putLong(interval).array();
        Mac mac = Mac.getInstance("HmacSHA1");
        mac.init(new SecretKeySpec(key, "HmacSHA1"));
        byte[] hash = mac.doFinal(data);
        int offset = hash[hash.length - 1] & 0xf;
        int binary = ((hash[offset] & 0x7f) << 24)
                | ((hash[offset + 1] & 0xff) << 16)
                | ((hash[offset + 2] & 0xff) << 8)
                | (hash[offset + 3] & 0xff);
        int otp = binary % (int) Math.pow(10, TOTP_DIGITS);
        return String.format("%0" + TOTP_DIGITS + "d", otp);
    }

    private String base32Encode(byte[] data) {
        StringBuilder sb = new StringBuilder();
        int buffer = 0, bitsLeft = 0;
        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xff);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                sb.append(BASE32_CHARS.charAt((buffer >> (bitsLeft - 5)) & 31));
                bitsLeft -= 5;
            }
        }
        if (bitsLeft > 0) {
            sb.append(BASE32_CHARS.charAt((buffer << (5 - bitsLeft)) & 31));
        }
        return sb.toString();
    }

    private byte[] base32Decode(String encoded) {
        encoded = encoded.toUpperCase().replaceAll("[^A-Z2-7]", "");
        int buffer = 0, bitsLeft = 0;
        List<Byte> bytes = new ArrayList<>();
        for (char c : encoded.toCharArray()) {
            int val = BASE32_CHARS.indexOf(c);
            if (val < 0) continue;
            buffer = (buffer << 5) | val;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                bytes.add((byte) (buffer >> (bitsLeft - 8)));
                bitsLeft -= 8;
            }
        }
        byte[] result = new byte[bytes.size()];
        for (int i = 0; i < bytes.size(); i++) {
            result[i] = bytes.get(i);
        }
        return result;
    }
}
