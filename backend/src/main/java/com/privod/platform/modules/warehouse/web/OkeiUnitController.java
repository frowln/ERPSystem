package com.privod.platform.modules.warehouse.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.warehouse.domain.OkeiUnit;
import com.privod.platform.modules.warehouse.repository.OkeiUnitRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * P1-WAR-1: Справочник ОКЕИ — единицы измерения.
 * Используется для валидации поля unitOfMeasure и выбора ед.изм. в формах.
 */
@RestController
@RequestMapping("/api/reference/units")
@RequiredArgsConstructor
@Tag(name = "ОКEИ Reference", description = "Справочник единиц измерения ОКЕИ (ОК 015-94)")
public class OkeiUnitController {

    private final OkeiUnitRepository okeiUnitRepository;

    @GetMapping
    @Operation(summary = "P1-WAR-1: Список единиц измерения ОКЕИ (активные)")
    public ResponseEntity<ApiResponse<List<OkeiUnit>>> list(
            @RequestParam(required = false) String category) {
        List<OkeiUnit> units = category != null
                ? okeiUnitRepository.findByCategoryIgnoreCaseAndDeletedFalse(category)
                : okeiUnitRepository.findByDeletedFalseAndActiveTrue();
        return ResponseEntity.ok(ApiResponse.ok(units));
    }
}
