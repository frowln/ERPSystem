package com.privod.platform.infrastructure.storage;

import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;

/**
 * Abstraction over object storage (S3, MinIO, local filesystem).
 * Implementations: {@link S3StorageService} for AWS S3 / MinIO.
 */
public interface StorageService {

    /**
     * Upload a multipart file and return the storage key.
     *
     * @param file      file to upload
     * @param keyPrefix folder/prefix for the key (e.g. "documents", "bim-models")
     * @return storage key that can be used to generate a presigned URL
     */
    String upload(MultipartFile file, String keyPrefix);

    /**
     * Upload raw bytes and return the storage key.
     *
     * @param data        file content
     * @param key         full storage key including file name
     * @param contentType MIME type of the file
     * @return the key that was stored
     */
    String upload(byte[] data, String key, String contentType);

    /**
     * Generate a presigned download URL for the given key.
     *
     * @param key      storage key
     * @param validity how long the URL should be valid
     * @return time-limited download URL
     */
    String getPresignedUrl(String key, Duration validity);

    /**
     * Generate a presigned URL with default 1-hour validity.
     */
    default String getPresignedUrl(String key) {
        return getPresignedUrl(key, Duration.ofHours(1));
    }

    /**
     * Permanently delete a file.
     *
     * @param key storage key
     */
    void delete(String key);

    /**
     * Check whether a file exists in storage.
     *
     * @param key storage key
     * @return {@code true} if the object exists
     */
    boolean exists(String key);
}
