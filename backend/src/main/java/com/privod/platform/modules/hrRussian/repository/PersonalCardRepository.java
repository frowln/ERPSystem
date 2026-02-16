package com.privod.platform.modules.hrRussian.repository;

import com.privod.platform.modules.hrRussian.domain.PersonalCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PersonalCardRepository extends JpaRepository<PersonalCard, UUID> {

    Optional<PersonalCard> findByEmployeeIdAndDeletedFalse(UUID employeeId);
}
