package com.privod.platform.modules.russianDoc.repository;

import com.privod.platform.modules.russianDoc.domain.RussianDocStatus;
import com.privod.platform.modules.russianDoc.domain.WriteOffAct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WriteOffActRepository extends JpaRepository<WriteOffAct, UUID> {

    Page<WriteOffAct> findByDeletedFalse(Pageable pageable);

    Page<WriteOffAct> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<WriteOffAct> findByStatusAndDeletedFalse(RussianDocStatus status);
}
