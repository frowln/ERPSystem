package com.privod.platform.modules.ops.repository;

import com.privod.platform.modules.ops.domain.Defect;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DefectRepository extends JpaRepository<Defect, UUID>, JpaSpecificationExecutor<Defect> {

    @Query(value = "SELECT nextval('defect_code_seq')", nativeQuery = true)
    long getNextCodeSequence();
}
