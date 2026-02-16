package com.privod.platform.modules.hrRussian.repository;

import com.privod.platform.modules.hrRussian.domain.EmploymentOrder;
import com.privod.platform.modules.hrRussian.domain.OrderType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmploymentOrderRepository extends JpaRepository<EmploymentOrder, UUID> {

    List<EmploymentOrder> findByEmployeeIdAndDeletedFalseOrderByOrderDateDesc(UUID employeeId);

    Page<EmploymentOrder> findByOrderTypeAndDeletedFalse(OrderType orderType, Pageable pageable);

    Page<EmploymentOrder> findByDeletedFalse(Pageable pageable);
}
