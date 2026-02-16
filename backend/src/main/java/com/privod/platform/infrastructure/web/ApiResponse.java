package com.privod.platform.infrastructure.web;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean success;
    private final T data;
    private final ErrorDetails error;
    private final Instant timestamp;
    private final String requestId;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class ErrorDetails {
        private final int code;
        private final String message;
        private final Object details;
    }

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .timestamp(Instant.now())
                .requestId(UUID.randomUUID().toString())
                .build();
    }

    public static <T> ApiResponse<T> ok() {
        return ApiResponse.<T>builder()
                .success(true)
                .timestamp(Instant.now())
                .requestId(UUID.randomUUID().toString())
                .build();
    }

    public static <T> ApiResponse<T> error(int code, String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .error(ErrorDetails.builder()
                        .code(code)
                        .message(message)
                        .build())
                .timestamp(Instant.now())
                .requestId(UUID.randomUUID().toString())
                .build();
    }

    public static <T> ApiResponse<T> error(int code, String message, Object details) {
        return ApiResponse.<T>builder()
                .success(false)
                .error(ErrorDetails.builder()
                        .code(code)
                        .message(message)
                        .details(details)
                        .build())
                .timestamp(Instant.now())
                .requestId(UUID.randomUUID().toString())
                .build();
    }

    public static <T> ApiResponse<T> of(T data) {
        return ok(data);
    }
}
