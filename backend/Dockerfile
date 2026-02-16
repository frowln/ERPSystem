# =============================================================================
# PRIVOD NEXT Backend -- Production Multi-Stage Build
# Java 21 / Spring Boot 3.4 / Gradle 8.12
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Dependency cache
# ---------------------------------------------------------------------------
FROM gradle:8.12-jdk21 AS deps

WORKDIR /app

# Copy only build configuration for dependency caching
COPY build.gradle.kts settings.gradle.kts ./
COPY gradle ./gradle

# Download dependencies (this layer is cached unless build files change)
RUN gradle dependencies --no-daemon --stacktrace || true

# ---------------------------------------------------------------------------
# Stage 2: Build application
# ---------------------------------------------------------------------------
FROM deps AS builder

WORKDIR /app

# Copy source code
COPY src ./src

# Build the fat JAR, skip tests (tests run in CI)
RUN gradle bootJar --no-daemon -x test

# Extract layered JAR for optimized Docker layers
RUN java -Djarmode=layertools -jar build/libs/*.jar extract --destination /app/extracted

# ---------------------------------------------------------------------------
# Stage 3: Production runtime
# ---------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runtime

# Install curl for health checks and tini for proper PID 1
RUN apk add --no-cache curl tini

# Create non-root user
RUN addgroup -S privod && adduser -S privod -G privod

WORKDIR /app

# Copy extracted layers (ordered by change frequency for cache optimization)
COPY --from=builder /app/extracted/dependencies/ ./
COPY --from=builder /app/extracted/spring-boot-loader/ ./
COPY --from=builder /app/extracted/snapshot-dependencies/ ./
COPY --from=builder /app/extracted/application/ ./

# Set ownership
RUN chown -R privod:privod /app

# Switch to non-root user
USER privod

# Expose application port
EXPOSE 8080

# Health check against Spring Actuator
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=60s \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# JVM options optimized for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport \
    -XX:MaxRAMPercentage=75.0 \
    -XX:+UseZGC \
    -XX:+ZGenerational \
    -Djava.security.egd=file:/dev/./urandom \
    -Dspring.jmx.enabled=false"

# Use tini as init system for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Run the Spring Boot application using layered launch
CMD ["sh", "-c", "java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
