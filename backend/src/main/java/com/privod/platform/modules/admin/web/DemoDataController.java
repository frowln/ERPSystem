package com.privod.platform.modules.admin.web;

import com.privod.platform.modules.admin.service.DemoDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/demo-data")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
@Tag(name = "Demo Data", description = "Demo data seed/clear for admin setup")
public class DemoDataController {

    private final DemoDataService demoDataService;

    @PostMapping("/seed")
    @Operation(summary = "Seed demo data for all modules")
    public ResponseEntity<Map<String, Object>> seedDemoData() {
        log.info("Demo data seed requested");
        DemoDataService.DemoDataResult result = demoDataService.seedAllModules();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Демо-данные успешно загружены",
                "created", result.getCreatedCount(),
                "modules", result.getModules()
        ));
    }

    @DeleteMapping("/clear")
    @Operation(summary = "Clear all demo data (DEMO-* prefixed records)")
    public ResponseEntity<Map<String, Object>> clearDemoData() {
        log.info("Demo data clear requested");
        int deleted = demoDataService.clearDemoData();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Демо-данные удалены",
                "deleted", deleted
        ));
    }
}
