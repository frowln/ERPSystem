package com.privod.platform.modules.chatter.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.chatter.service.EntityChangeLogService;
import com.privod.platform.modules.chatter.web.dto.EntityChangeLogResponse;
import com.privod.platform.modules.chatter.web.dto.LogChangeRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/chatter/changelog")
@RequiredArgsConstructor
@Tag(name = "Chatter - Change Log", description = "Entity field change tracking")
@PreAuthorize("isAuthenticated()")
public class EntityChangeLogController {

    private final EntityChangeLogService changeLogService;

    @PostMapping
    @Operation(summary = "Log a field change")
    public ResponseEntity<ApiResponse<EntityChangeLogResponse>> logChange(
            @Valid @RequestBody LogChangeRequest request) {
        EntityChangeLogResponse response = changeLogService.logChange(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping
    @Operation(summary = "List change logs for an entity")
    public ResponseEntity<ApiResponse<PageResponse<EntityChangeLogResponse>>> list(
            @RequestParam String entityType,
            @RequestParam UUID entityId,
            @RequestParam(required = false) String fieldName,
            @PageableDefault(size = 50, sort = "changedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EntityChangeLogResponse> page = changeLogService.getChangeLogs(
                entityType, entityId, fieldName, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }
}
