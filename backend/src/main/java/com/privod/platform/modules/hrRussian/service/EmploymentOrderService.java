package com.privod.platform.modules.hrRussian.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.hrRussian.domain.EmploymentOrder;
import com.privod.platform.modules.hrRussian.domain.OrderType;
import com.privod.platform.modules.hrRussian.repository.EmploymentOrderRepository;
import com.privod.platform.modules.hrRussian.web.dto.CreateEmploymentOrderRequest;
import com.privod.platform.modules.hrRussian.web.dto.EmploymentOrderResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmploymentOrderService {

    private final EmploymentOrderRepository orderRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<EmploymentOrderResponse> getByEmployee(UUID employeeId) {
        return orderRepository.findByEmployeeIdAndDeletedFalseOrderByOrderDateDesc(employeeId)
                .stream()
                .map(EmploymentOrderResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<EmploymentOrderResponse> listOrders(OrderType orderType, Pageable pageable) {
        if (orderType != null) {
            return orderRepository.findByOrderTypeAndDeletedFalse(orderType, pageable)
                    .map(EmploymentOrderResponse::fromEntity);
        }
        return orderRepository.findByDeletedFalse(pageable)
                .map(EmploymentOrderResponse::fromEntity);
    }

    @Transactional
    public EmploymentOrderResponse createOrder(CreateEmploymentOrderRequest request) {
        EmploymentOrder order = EmploymentOrder.builder()
                .employeeId(request.employeeId())
                .orderNumber(request.orderNumber())
                .orderType(request.orderType())
                .orderDate(request.orderDate())
                .effectiveDate(request.effectiveDate())
                .reason(request.reason())
                .basis(request.basis())
                .signedById(request.signedById())
                .build();

        order = orderRepository.save(order);
        auditService.logCreate("EmploymentOrder", order.getId());

        log.info("Employment order created: {} ({}) for employee {}",
                order.getOrderNumber(), order.getOrderType(), request.employeeId());
        return EmploymentOrderResponse.fromEntity(order);
    }

    @Transactional
    public void deleteOrder(UUID id) {
        EmploymentOrder order = orderRepository.findById(id)
                .filter(o -> !o.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Приказ не найден: " + id));
        order.softDelete();
        orderRepository.save(order);
        auditService.logDelete("EmploymentOrder", id);
        log.info("Employment order soft-deleted: {}", id);
    }
}
