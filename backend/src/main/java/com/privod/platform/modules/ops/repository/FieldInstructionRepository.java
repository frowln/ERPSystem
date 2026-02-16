package com.privod.platform.modules.ops.repository;

import com.privod.platform.modules.ops.domain.FieldInstruction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface FieldInstructionRepository extends JpaRepository<FieldInstruction, UUID>, JpaSpecificationExecutor<FieldInstruction> {

    @Query(value = "SELECT nextval('field_instruction_code_seq')", nativeQuery = true)
    long getNextCodeSequence();
}
