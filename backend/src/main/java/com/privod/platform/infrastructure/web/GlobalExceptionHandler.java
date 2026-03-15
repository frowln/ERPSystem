package com.privod.platform.infrastructure.web;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
@Slf4j
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    private String getRequestId() {
        String id = MDC.get("requestId");
        return id != null ? id : UUID.randomUUID().toString();
    }

    private Locale getLocale() {
        return LocaleContextHolder.getLocale();
    }

    private String msg(String code, Object... args) {
        return messageSource.getMessage(code, args, code, getLocale());
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleEntityNotFound(EntityNotFoundException ex) {
        String requestId = getRequestId();
        log.warn("Entity not found [requestId={}]: {}", requestId, ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(404, ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        String requestId = getRequestId();
        log.warn("Access denied [requestId={}]: {}", requestId, ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(403, msg("error.access_denied")));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        String requestId = getRequestId();
        log.warn("Bad credentials [requestId={}]: {}", requestId, ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(401, msg("auth.invalid_credentials")));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String requestId = getRequestId();
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        log.warn("Validation failed [requestId={}]: {}", requestId, errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, msg("error.validation"), errors));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(DataIntegrityViolationException ex) {
        String requestId = getRequestId();
        log.error("Data integrity violation [requestId={}]: {}", requestId, ex.getMessage());
        String message = msg("error.conflict");
        if (ex.getMessage() != null && ex.getMessage().contains("duplicate key")) {
            message = msg("error.duplicate_key");
        }
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(409, message));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
        String requestId = getRequestId();
        log.warn("Illegal argument [requestId={}]: {}", requestId, ex.getMessage());

        String message = ex.getMessage();
        if (message != null && message.contains("Invalid UUID string")) {
            message = msg("error.invalid_uuid");
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, message));
    }

    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex) {
        String requestId = getRequestId();
        String message = msg("error.invalid_parameter");

        if (ex.getCause() instanceof IllegalArgumentException &&
            ex.getCause().getMessage() != null &&
            ex.getCause().getMessage().contains("Invalid UUID string")) {
            message = msg("error.invalid_uuid");
        }

        log.warn("Type mismatch [requestId={}]: {}", requestId, ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, message));
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleHttpMessageNotReadable(
            org.springframework.http.converter.HttpMessageNotReadableException ex) {
        String requestId = getRequestId();
        log.warn("Message not readable [requestId={}]: {}", requestId, ex.getMessage());
        String message = msg("error.bad_request");
        if (ex.getMessage() != null) {
            if (ex.getMessage().contains("UUID")) {
                message = msg("error.invalid_uuid");
            } else if (ex.getMessage().contains("Cannot deserialize")) {
                message = msg("error.data_format");
            }
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, message));
    }

    @ExceptionHandler(org.springframework.web.bind.MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingParam(
            org.springframework.web.bind.MissingServletRequestParameterException ex) {
        String requestId = getRequestId();
        log.warn("Missing parameter [requestId={}]: {}", requestId, ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(400, ex.getMessage()));
    }

    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotAllowed(
            org.springframework.web.HttpRequestMethodNotSupportedException ex) {
        String requestId = getRequestId();
        log.warn("Method not allowed [requestId={}]: {}", requestId, ex.getMessage());
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(ApiResponse.error(405, msg("error.method_not_allowed")));
    }

    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResource(
            org.springframework.web.servlet.resource.NoResourceFoundException ex) {
        String requestId = getRequestId();
        log.warn("Resource not found [requestId={}]: {}", requestId, ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(404, msg("error.endpoint_not_found")));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalState(IllegalStateException ex) {
        String requestId = getRequestId();
        log.warn("Illegal state [requestId={}]: {}", requestId, ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(409, ex.getMessage()));
    }

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleResponseStatus(org.springframework.web.server.ResponseStatusException ex) {
        String requestId = getRequestId();
        log.warn("ResponseStatus [requestId={}]: {} {}", requestId, ex.getStatusCode(), ex.getReason());
        int code = ex.getStatusCode().value();
        String reason = ex.getReason() != null ? ex.getReason() : ex.getMessage();
        return ResponseEntity.status(ex.getStatusCode())
                .body(ApiResponse.error(code, reason));
    }

    @ExceptionHandler(com.privod.platform.infrastructure.storage.StorageException.class)
    public ResponseEntity<ApiResponse<Void>> handleStorageException(com.privod.platform.infrastructure.storage.StorageException ex) {
        String requestId = getRequestId();
        log.error("Storage error [requestId={}]: {}", requestId, ex.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiResponse.error(503, msg("error.storage")));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
        String requestId = getRequestId();
        log.error("Unhandled exception [requestId={}]: ", requestId, ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(500, msg("error.internal") + " [Request ID: " + requestId + "]"));
    }
}
