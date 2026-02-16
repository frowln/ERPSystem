package com.privod.platform.modules.russianDoc.repository;

import com.privod.platform.modules.russianDoc.domain.Act;
import com.privod.platform.modules.russianDoc.domain.RussianDocStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActRepository extends JpaRepository<Act, UUID>, JpaSpecificationExecutor<Act> {

    Page<Act> findByDeletedFalse(Pageable pageable);

    Page<Act> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<Act> findByContractIdAndDeletedFalseOrderByDateDesc(UUID contractId);

    List<Act> findByStatusAndDeletedFalse(RussianDocStatus status);
}
