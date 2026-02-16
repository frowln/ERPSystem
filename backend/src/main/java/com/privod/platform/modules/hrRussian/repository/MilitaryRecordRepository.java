package com.privod.platform.modules.hrRussian.repository;

import com.privod.platform.modules.hrRussian.domain.MilitaryRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MilitaryRecordRepository extends JpaRepository<MilitaryRecord, UUID> {

    Optional<MilitaryRecord> findByEmployeeIdAndDeletedFalse(UUID employeeId);
}
