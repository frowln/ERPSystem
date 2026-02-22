package com.privod.platform.modules.pto.repository;

import com.privod.platform.modules.pto.domain.HiddenWorkActSignature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HiddenWorkActSignatureRepository extends JpaRepository<HiddenWorkActSignature, UUID> {

    List<HiddenWorkActSignature> findByActIdAndDeletedFalse(UUID actId);

    Optional<HiddenWorkActSignature> findByActIdAndSignerUserIdAndDeletedFalse(UUID actId, UUID signerUserId);

    long countByActIdAndStatusAndDeletedFalse(UUID actId, HiddenWorkActSignature.SignatureStatus status);

    long countByActIdAndDeletedFalse(UUID actId);
}
