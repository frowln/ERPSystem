package com.privod.platform.infrastructure.storage;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app.storage")
public class StorageProperties {

    /** Storage backend type: s3, minio. */
    private String type = "minio";

    /** S3/MinIO bucket name. */
    private String bucket = "privod-files";

    /** Endpoint URL — required for MinIO; leave default for AWS S3. */
    private String endpoint = "http://localhost:9000";

    /** AWS region (us-east-1 for MinIO). */
    private String region = "us-east-1";

    /** S3 access key / MinIO root user. */
    private String accessKey = "minioadmin";

    /** S3 secret key / MinIO root password. */
    private String secretKey = "minioadmin";

    /** Enable path-style access — required for MinIO. */
    private boolean pathStyleAccess = true;
}
