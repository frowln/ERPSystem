package com.privod.platform.infrastructure.storage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

/**
 * Configures the S3 / MinIO storage beans.
 * <p>
 * Works with both AWS S3 (set {@code app.storage.endpoint} to the default AWS endpoint)
 * and MinIO (set the MinIO server URL and enable {@code pathStyleAccess}).
 */
@Configuration
@EnableConfigurationProperties(StorageProperties.class)
@RequiredArgsConstructor
@Slf4j
public class StorageConfig {

    private final StorageProperties properties;

    @Bean
    public S3Client s3Client() {
        AwsBasicCredentials credentials = AwsBasicCredentials.create(
                properties.getAccessKey(), properties.getSecretKey());

        return S3Client.builder()
                .endpointOverride(URI.create(properties.getEndpoint()))
                .region(Region.of(properties.getRegion()))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(properties.isPathStyleAccess())
                        .build())
                .build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        AwsBasicCredentials credentials = AwsBasicCredentials.create(
                properties.getAccessKey(), properties.getSecretKey());

        return S3Presigner.builder()
                .endpointOverride(URI.create(properties.getEndpoint()))
                .region(Region.of(properties.getRegion()))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(properties.isPathStyleAccess())
                        .build())
                .build();
    }

    @Bean
    public StorageService storageService(S3Client s3Client, S3Presigner presigner,
                                         FileValidationService fileValidationService) {
        log.info("Initializing S3/MinIO storage adapter: endpoint={}, bucket={}",
                properties.getEndpoint(), properties.getBucket());
        ensureBucketExists(s3Client);
        return new S3StorageService(s3Client, presigner, properties, fileValidationService);
    }

    private void ensureBucketExists(S3Client client) {
        String bucket = properties.getBucket();
        try {
            client.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
            log.info("Storage bucket '{}' exists", bucket);
        } catch (NoSuchBucketException e) {
            log.info("Bucket '{}' does not exist — creating...", bucket);
            client.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
            log.info("Bucket '{}' created successfully", bucket);
        } catch (Exception e) {
            log.warn("Could not verify bucket '{}': {}. Upload may fail.", bucket, e.getMessage());
        }
    }
}
