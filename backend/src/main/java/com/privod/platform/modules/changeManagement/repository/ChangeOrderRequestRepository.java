package com.privod.platform.modules.changeManagement.repository;

import com.privod.platform.modules.changeManagement.domain.ChangeOrderRequest;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChangeOrderRequestRepository extends JpaRepository<ChangeOrderRequest, UUID>,
        JpaSpecificationExecutor<ChangeOrderRequest> {

    Page<ChangeOrderRequest> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<ChangeOrderRequest> findByChangeEventIdAndDeletedFalse(UUID changeEventId, Pageable pageable);

    List<ChangeOrderRequest> findByChangeEventIdAndDeletedFalse(UUID changeEventId);

    long countByChangeEventIdAndStatusAndDeletedFalse(UUID changeEventId, ChangeOrderRequestStatus status);

    @Query(value = "SELECT nextval('change_order_request_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
