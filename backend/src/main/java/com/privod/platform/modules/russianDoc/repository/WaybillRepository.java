package com.privod.platform.modules.russianDoc.repository;

import com.privod.platform.modules.russianDoc.domain.RussianDocStatus;
import com.privod.platform.modules.russianDoc.domain.Waybill;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WaybillRepository extends JpaRepository<Waybill, UUID> {

    Page<Waybill> findByDeletedFalse(Pageable pageable);

    Page<Waybill> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<Waybill> findBySenderIdAndDeletedFalseOrderByDateDesc(UUID senderId);

    List<Waybill> findByStatusAndDeletedFalse(RussianDocStatus status);
}
