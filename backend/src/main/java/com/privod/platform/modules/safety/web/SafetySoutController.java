package com.privod.platform.modules.safety.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.safety.service.SafetySoutService;
import com.privod.platform.modules.safety.web.dto.SoutCardResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/safety/sout")
@RequiredArgsConstructor
@Tag(name = "Safety SOUT", description = "СОУТ — Специальная оценка условий труда (workplace assessment)")
public class SafetySoutController {

    private final SafetySoutService soutService;

    @GetMapping
    @Operation(summary = "Get SOUT cards list (paginated)")
    public ResponseEntity<ApiResponse<PageResponse<SoutCardResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "assessmentDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SoutCardResponse> page = soutService.listCards(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get SOUT card details by ID")
    public ResponseEntity<ApiResponse<SoutCardResponse>> getById(@PathVariable UUID id) {
        SoutCardResponse response = soutService.getCard(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
