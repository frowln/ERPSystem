package com.privod.platform.modules.cde.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.cde.domain.TransmittalStatus;
import com.privod.platform.modules.cde.service.TransmittalService;
import com.privod.platform.modules.cde.web.dto.AddTransmittalItemRequest;
import com.privod.platform.modules.cde.web.dto.CreateTransmittalRequest;
import com.privod.platform.modules.cde.web.dto.TransmittalItemResponse;
import com.privod.platform.modules.cde.web.dto.TransmittalResponse;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cde/transmittals")
@RequiredArgsConstructor
@Tag(name = "CDE Transmittals", description = "ISO 19650 Transmittal management")
public class TransmittalController {

    private final TransmittalService transmittalService;

    @GetMapping
    @Operation(summary = "Список трансмитталов проекта с фильтрацией и пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<TransmittalResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) TransmittalStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<TransmittalResponse> page = transmittalService.findByProject(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить трансмиттал по ID")
    public ResponseEntity<ApiResponse<TransmittalResponse>> getById(@PathVariable UUID id) {
        TransmittalResponse response = transmittalService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать трансмиттал")
    public ResponseEntity<ApiResponse<TransmittalResponse>> create(
            @Valid @RequestBody CreateTransmittalRequest request) {
        TransmittalResponse response = transmittalService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Добавить позицию в трансмиттал")
    public ResponseEntity<ApiResponse<TransmittalItemResponse>> addItem(
            @PathVariable UUID id,
            @Valid @RequestBody AddTransmittalItemRequest request) {
        TransmittalItemResponse response = transmittalService.addItem(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/items")
    @Operation(summary = "Получить позиции трансмиттала")
    public ResponseEntity<ApiResponse<List<TransmittalItemResponse>>> getItems(@PathVariable UUID id) {
        List<TransmittalItemResponse> items = transmittalService.getItems(id);
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @PatchMapping("/{id}/issue")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Выпустить трансмиттал (создаёт записи аудита для каждого документа)")
    public ResponseEntity<ApiResponse<TransmittalResponse>> issue(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID sentById) {
        TransmittalResponse response = transmittalService.issue(id, sentById);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/acknowledge")
    @Operation(summary = "Подтвердить получение трансмиттала")
    public ResponseEntity<ApiResponse<TransmittalResponse>> acknowledge(@PathVariable UUID id) {
        TransmittalResponse response = transmittalService.acknowledge(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Закрыть трансмиттал")
    public ResponseEntity<ApiResponse<TransmittalResponse>> close(@PathVariable UUID id) {
        TransmittalResponse response = transmittalService.close(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить трансмиттал (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        transmittalService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
