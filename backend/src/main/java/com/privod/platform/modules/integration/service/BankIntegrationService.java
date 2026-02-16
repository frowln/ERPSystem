package com.privod.platform.modules.integration.service;

import com.privod.platform.modules.integration.domain.SyncDirection;
import com.privod.platform.modules.integration.domain.SyncType;
import com.privod.platform.modules.integration.web.dto.BankStatementRequest;
import com.privod.platform.modules.integration.web.dto.CreatePaymentOrderRequest;
import com.privod.platform.modules.integration.web.dto.StartSyncRequest;
import com.privod.platform.modules.integration.web.dto.SyncJobResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BankIntegrationService {

    private final SyncService syncService;
    private final IntegrationEndpointService endpointService;

    @Transactional
    public SyncJobResponse syncBankStatements(BankStatementRequest request) {
        log.info("Синхронизация банковских выписок: endpoint={}, период: {} - {}",
                request.endpointId(), request.dateFrom(), request.dateTo());

        endpointService.getEndpointOrThrow(request.endpointId());

        StartSyncRequest syncRequest = new StartSyncRequest(
                request.endpointId(), SyncType.INCREMENTAL, SyncDirection.IMPORT, "bank_statement"
        );

        return syncService.startSync(syncRequest);
    }

    @Transactional
    public SyncJobResponse createPaymentOrder(CreatePaymentOrderRequest request) {
        log.info("Создание платёжного поручения: endpoint={}, сумма={}, получатель={}",
                request.endpointId(), request.amount(), request.recipientName());

        endpointService.getEndpointOrThrow(request.endpointId());

        StartSyncRequest syncRequest = new StartSyncRequest(
                request.endpointId(), SyncType.MANUAL, SyncDirection.EXPORT, "payment_order"
        );

        return syncService.startSync(syncRequest);
    }

    @Transactional(readOnly = true)
    public SyncJobResponse checkPaymentStatus(UUID syncJobId) {
        log.info("Проверка статуса платежа: syncJobId={}", syncJobId);
        return syncService.findById(syncJobId);
    }

    @Transactional
    public SyncJobResponse reconcilePayments(UUID endpointId) {
        log.info("Сверка платежей: endpoint={}", endpointId);

        endpointService.getEndpointOrThrow(endpointId);

        StartSyncRequest syncRequest = new StartSyncRequest(
                endpointId, SyncType.FULL, SyncDirection.BIDIRECTIONAL, "payment_reconciliation"
        );

        return syncService.startSync(syncRequest);
    }
}
