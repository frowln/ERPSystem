package com.privod.platform.modules.contract.repository;

import com.privod.platform.modules.contract.domain.ContractType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractTypeRepository extends JpaRepository<ContractType, UUID> {

    Optional<ContractType> findByCode(String code);

    List<ContractType> findAllByActiveTrueOrderBySequenceAsc();
}
