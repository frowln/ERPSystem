package com.privod.platform.modules.common.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.common.domain.UserFavorite;
import com.privod.platform.modules.common.repository.UserFavoriteRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Favorites", description = "Избранное пользователя (проекты, задачи, документы, контрагенты, контракты)")
public class FavoritesController {

    private final UserFavoriteRepository userFavoriteRepository;

    @GetMapping
    @Operation(summary = "Список избранного текущего пользователя")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<FavoriteResponse>>> list(
            @RequestParam(required = false) String type) {

        UUID userId = SecurityUtils.requireCurrentUserId();

        List<UserFavorite> favorites;
        if (type != null && !type.isBlank()) {
            favorites = userFavoriteRepository
                    .findByUserIdAndEntityTypeAndDeletedFalseOrderByCreatedAtDesc(userId, type.toUpperCase());
        } else {
            favorites = userFavoriteRepository
                    .findByUserIdAndDeletedFalseOrderByCreatedAtDesc(userId);
        }

        List<FavoriteResponse> response = favorites.stream()
                .map(FavoriteResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @Operation(summary = "Добавить в избранное")
    @Transactional
    public ResponseEntity<ApiResponse<FavoriteResponse>> add(@RequestBody AddFavoriteRequest request) {
        UUID userId = SecurityUtils.requireCurrentUserId();
        String entityType = request.entityType().toUpperCase();

        // Check if already exists
        var existing = userFavoriteRepository
                .findByUserIdAndEntityTypeAndEntityIdAndDeletedFalse(userId, entityType, request.entityId());
        if (existing.isPresent()) {
            return ResponseEntity.ok(ApiResponse.ok(FavoriteResponse.from(existing.get())));
        }

        UserFavorite favorite = UserFavorite.builder()
                .userId(userId)
                .entityType(entityType)
                .entityId(request.entityId())
                .entityName(request.entityName())
                .build();

        favorite = userFavoriteRepository.save(favorite);
        log.info("User {} added favorite: {} {} '{}'", userId, entityType, request.entityId(), request.entityName());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(FavoriteResponse.from(favorite)));
    }

    @DeleteMapping("/{entityType}/{entityId}")
    @Operation(summary = "Удалить из избранного")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> remove(
            @PathVariable String entityType,
            @PathVariable UUID entityId) {

        UUID userId = SecurityUtils.requireCurrentUserId();
        String type = entityType.toUpperCase();

        var existing = userFavoriteRepository
                .findByUserIdAndEntityTypeAndEntityIdAndDeletedFalse(userId, type, entityId);
        if (existing.isPresent()) {
            existing.get().softDelete();
            userFavoriteRepository.save(existing.get());
            log.info("User {} removed favorite: {} {}", userId, type, entityId);
        }

        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/check/{entityType}/{entityId}")
    @Operation(summary = "Проверить, находится ли сущность в избранном")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> check(
            @PathVariable String entityType,
            @PathVariable UUID entityId) {

        UUID userId = SecurityUtils.requireCurrentUserId();
        boolean isFavorite = userFavoriteRepository
                .existsByUserIdAndEntityTypeAndEntityIdAndDeletedFalse(userId, entityType.toUpperCase(), entityId);

        return ResponseEntity.ok(ApiResponse.ok(Map.of("isFavorite", isFavorite)));
    }

    // --- DTOs ---

    record AddFavoriteRequest(
            String entityType,
            UUID entityId,
            String entityName
    ) {}

    record FavoriteResponse(
            String id,
            String entityType,
            String entityId,
            String entityName,
            String createdAt
    ) {
        static FavoriteResponse from(UserFavorite f) {
            return new FavoriteResponse(
                    f.getId().toString(),
                    f.getEntityType(),
                    f.getEntityId().toString(),
                    f.getEntityName(),
                    f.getCreatedAt() != null ? f.getCreatedAt().toString() : null
            );
        }
    }
}
