package com.privod.platform.modules.russianDoc.repository;

import com.privod.platform.modules.russianDoc.domain.EdoAction;
import com.privod.platform.modules.russianDoc.domain.EdoExchangeLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EdoExchangeLogRepository extends JpaRepository<EdoExchangeLog, UUID> {

    List<EdoExchangeLog> findByEdoDocumentIdAndDeletedFalseOrderByPerformedAtDesc(UUID edoDocumentId);

    Page<EdoExchangeLog> findByActionAndDeletedFalse(EdoAction action, Pageable pageable);

    Page<EdoExchangeLog> findByPerformedByIdAndDeletedFalse(UUID performedById, Pageable pageable);
}
