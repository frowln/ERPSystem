package com.privod.platform.infrastructure.storage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

/**
 * S3 / MinIO object storage implementation.
 * Compatible with both AWS S3 and S3-compatible endpoints (MinIO, Ceph, etc.).
 */
@Slf4j
@RequiredArgsConstructor
public class S3StorageService implements StorageService {

    private final S3Client s3Client;
    private final S3Presigner presigner;
    private final StorageProperties properties;
    private final FileValidationService fileValidationService;

    /** Maps key prefix to validation context; falls back to "document" for unknown prefixes. */
    private static String resolveContext(String keyPrefix) {
        if (keyPrefix == null) return "document";
        return switch (keyPrefix) {
            case "bim-models" -> "bim";
            case "images", "photos" -> "image";
            case "exports", "csv" -> "csv";
            default -> "document";
        };
    }

    @Override
    public String upload(MultipartFile file, String keyPrefix) {
        // Validate file content-type and size before uploading to storage
        fileValidationService.validate(file, resolveContext(keyPrefix));
        try {
            String extension = extractExtension(file.getOriginalFilename());
            String key = keyPrefix + "/" + UUID.randomUUID() + extension;
            return upload(file.getBytes(), key, file.getContentType());
        } catch (IOException e) {
            throw new StorageException("Failed to read multipart file for upload", e);
        }
    }

    @Override
    public String upload(byte[] data, String key, String contentType) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(properties.getBucket())
                .key(key)
                .contentType(contentType != null ? contentType : "application/octet-stream")
                .contentLength((long) data.length)
                .build();

        s3Client.putObject(request, RequestBody.fromBytes(data));
        log.debug("Uploaded object: bucket={}, key={}, size={}B",
                properties.getBucket(), key, data.length);
        return key;
    }

    @Override
    public String getPresignedUrl(String key, Duration validity) {
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(validity)
                .getObjectRequest(r -> r.bucket(properties.getBucket()).key(key))
                .build();
        return presigner.presignGetObject(presignRequest).url().toString();
    }

    @Override
    public void delete(String key) {
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(properties.getBucket())
                .key(key)
                .build());
        log.debug("Deleted object: bucket={}, key={}", properties.getBucket(), key);
    }

    @Override
    public boolean exists(String key) {
        try {
            s3Client.headObject(HeadObjectRequest.builder()
                    .bucket(properties.getBucket())
                    .key(key)
                    .build());
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        }
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return "." + filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
