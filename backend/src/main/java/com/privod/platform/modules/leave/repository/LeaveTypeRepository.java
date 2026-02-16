package com.privod.platform.modules.leave.repository;

import com.privod.platform.modules.leave.domain.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeaveTypeRepository extends JpaRepository<LeaveType, UUID> {

    List<LeaveType> findByIsActiveTrueAndDeletedFalse();

    List<LeaveType> findByDeletedFalse();

    Optional<LeaveType> findByCodeAndDeletedFalse(String code);
}
