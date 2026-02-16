package com.privod.platform.modules.ops.repository;

import com.privod.platform.modules.ops.domain.ShiftHandover;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ShiftHandoverRepository extends JpaRepository<ShiftHandover, UUID> {

    List<ShiftHandover> findByProjectIdAndDeletedFalseOrderByHandoverDateDesc(UUID projectId);
}
