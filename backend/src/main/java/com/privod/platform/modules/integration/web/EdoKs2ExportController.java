package com.privod.platform.modules.integration.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.integration.service.EdoKs2ExportService;
import com.privod.platform.modules.integration.service.EdoKs2ExportService.EdoSendResult;
import com.privod.platform.modules.integration.service.EdoKs2ExportService.EdoStatusResult;
import com.privod.platform.modules.integration.domain.SbisDocument;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/integrations/edo-export")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
@Tag(name = "EDO Export", description = "Отправка КС-2/КС-3 через ЭДО (СБИС)")
public class EdoKs2ExportController {

    private final EdoKs2ExportService edoKs2ExportService;

    @PostMapping("/ks2/{ks2Id}/send")
    @Operation(summary = "Отправить документ КС-2 в ЭДО (СБИС)")
    public ResponseEntity<ApiResponse<EdoSendResult>> sendKs2ToEdo(@PathVariable UUID ks2Id) {
        EdoSendResult result = edoKs2ExportService.sendKs2ToEdo(ks2Id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/ks3/{ks3Id}/send")
    @Operation(summary = "Отправить документ КС-3 в ЭДО (СБИС)")
    public ResponseEntity<ApiResponse<EdoSendResult>> sendKs3ToEdo(@PathVariable UUID ks3Id) {
        EdoSendResult result = edoKs2ExportService.sendKs3ToEdo(ks3Id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/status/{sbisDocId}")
    @Operation(summary = "Проверить статус доставки документа в ЭДО")
    public ResponseEntity<ApiResponse<EdoStatusResult>> checkDeliveryStatus(@PathVariable UUID sbisDocId) {
        EdoStatusResult result = edoKs2ExportService.checkDeliveryStatus(sbisDocId);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/inbound")
    @Operation(summary = "Получить входящий документ из ЭДО (вебхук СБИС)")
    public ResponseEntity<ApiResponse<UUID>> receiveInbound(@RequestBody Map<String, Object> payload) {
        SbisDocument doc = edoKs2ExportService.receiveInboundDocument(payload);
        return ResponseEntity.ok(ApiResponse.ok(doc.getId()));
    }
}
