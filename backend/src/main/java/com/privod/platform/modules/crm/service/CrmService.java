package com.privod.platform.modules.crm.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.crm.domain.CrmActivity;
import com.privod.platform.modules.crm.domain.CrmLead;
import com.privod.platform.modules.crm.domain.CrmStage;
import com.privod.platform.modules.crm.domain.CrmTeam;
import com.privod.platform.modules.crm.domain.LeadPriority;
import com.privod.platform.modules.crm.domain.LeadStatus;
import com.privod.platform.modules.crm.repository.CrmActivityRepository;
import com.privod.platform.modules.crm.repository.CrmLeadRepository;
import com.privod.platform.modules.crm.repository.CrmStageRepository;
import com.privod.platform.modules.crm.repository.CrmTeamRepository;
import com.privod.platform.modules.crm.web.dto.ConvertToProjectRequest;
import com.privod.platform.modules.crm.web.dto.CreateCrmActivityRequest;
import com.privod.platform.modules.crm.web.dto.CreateCrmLeadRequest;
import com.privod.platform.modules.crm.web.dto.CreateCrmStageRequest;
import com.privod.platform.modules.crm.web.dto.CreateCrmTeamRequest;
import com.privod.platform.modules.crm.web.dto.CrmActivityResponse;
import com.privod.platform.modules.crm.web.dto.CrmLeadResponse;
import com.privod.platform.modules.crm.web.dto.CrmPipelineResponse;
import com.privod.platform.modules.crm.web.dto.CrmStageResponse;
import com.privod.platform.modules.crm.web.dto.CrmTeamResponse;
import com.privod.platform.modules.crm.web.dto.UpdateCrmLeadRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CrmService {

    private final CrmLeadRepository leadRepository;
    private final CrmStageRepository stageRepository;
    private final CrmTeamRepository teamRepository;
    private final CrmActivityRepository activityRepository;
    private final AuditService auditService;

    // ===================== Leads =====================

    @Transactional(readOnly = true)
    public Page<CrmLeadResponse> listLeads(String search, LeadStatus status, UUID stageId,
                                             UUID assignedToId, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return leadRepository.search(search, pageable).map(CrmLeadResponse::fromEntity);
        }
        if (status != null) {
            return leadRepository.findByStatusAndDeletedFalse(status, pageable).map(CrmLeadResponse::fromEntity);
        }
        if (stageId != null) {
            return leadRepository.findByStageIdAndDeletedFalse(stageId, pageable).map(CrmLeadResponse::fromEntity);
        }
        if (assignedToId != null) {
            return leadRepository.findByAssignedToIdAndDeletedFalse(assignedToId, pageable)
                    .map(CrmLeadResponse::fromEntity);
        }
        return leadRepository.findAll(pageable).map(CrmLeadResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public CrmLeadResponse getLead(UUID id) {
        CrmLead lead = getLeadOrThrow(id);
        return CrmLeadResponse.fromEntity(lead);
    }

    @Transactional
    public CrmLeadResponse createLead(CreateCrmLeadRequest request) {
        CrmLead lead = CrmLead.builder()
                .name(request.name())
                .partnerName(request.partnerName())
                .email(request.email())
                .phone(request.phone())
                .companyName(request.companyName())
                .source(request.source())
                .medium(request.medium())
                .stageId(request.stageId())
                .assignedToId(request.assignedToId())
                .expectedRevenue(request.expectedRevenue())
                .probability(request.probability() != null ? request.probability() : 0)
                .priority(request.priority() != null ? request.priority() : LeadPriority.NORMAL)
                .description(request.description())
                .status(LeadStatus.NEW)
                .nextActivityDate(request.nextActivityDate())
                .build();

        lead = leadRepository.save(lead);
        auditService.logCreate("CrmLead", lead.getId());

        log.info("CRM lead created: {} - {} ({})", lead.getName(), lead.getCompanyName(), lead.getId());
        return CrmLeadResponse.fromEntity(lead);
    }

    @Transactional
    public CrmLeadResponse updateLead(UUID id, UpdateCrmLeadRequest request) {
        CrmLead lead = getLeadOrThrow(id);

        if (request.name() != null) lead.setName(request.name());
        if (request.partnerName() != null) lead.setPartnerName(request.partnerName());
        if (request.email() != null) lead.setEmail(request.email());
        if (request.phone() != null) lead.setPhone(request.phone());
        if (request.companyName() != null) lead.setCompanyName(request.companyName());
        if (request.source() != null) lead.setSource(request.source());
        if (request.medium() != null) lead.setMedium(request.medium());
        if (request.stageId() != null) lead.setStageId(request.stageId());
        if (request.assignedToId() != null) lead.setAssignedToId(request.assignedToId());
        if (request.expectedRevenue() != null) lead.setExpectedRevenue(request.expectedRevenue());
        if (request.probability() != null) lead.setProbability(request.probability());
        if (request.priority() != null) lead.setPriority(request.priority());
        if (request.description() != null) lead.setDescription(request.description());
        if (request.nextActivityDate() != null) lead.setNextActivityDate(request.nextActivityDate());

        if (request.status() != null) {
            LeadStatus oldStatus = lead.getStatus();
            lead.setStatus(request.status());
            if (request.status() == LeadStatus.WON) {
                lead.setWonDate(LocalDate.now());
            }
            if (request.status() == LeadStatus.LOST && request.lostReason() != null) {
                lead.setLostReason(request.lostReason());
            }
            auditService.logStatusChange("CrmLead", lead.getId(), oldStatus.name(), request.status().name());
        }

        lead = leadRepository.save(lead);
        auditService.logUpdate("CrmLead", lead.getId(), "multiple", null, null);

        log.info("CRM lead updated: {} ({})", lead.getName(), lead.getId());
        return CrmLeadResponse.fromEntity(lead);
    }

    @Transactional
    public CrmLeadResponse moveToStage(UUID leadId, UUID stageId) {
        CrmLead lead = getLeadOrThrow(leadId);
        CrmStage stage = stageRepository.findById(stageId)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Этап CRM не найден: " + stageId));

        UUID oldStageId = lead.getStageId();
        lead.setStageId(stageId);
        lead.setProbability(stage.getProbability());

        if (stage.isWon()) {
            lead.setStatus(LeadStatus.WON);
            lead.setWonDate(LocalDate.now());
        } else if (stage.isClosed()) {
            lead.setStatus(LeadStatus.LOST);
        }

        lead = leadRepository.save(lead);
        auditService.logUpdate("CrmLead", lead.getId(), "stageId",
                oldStageId != null ? oldStageId.toString() : null, stageId.toString());

        log.info("CRM lead {} moved to stage {} ({})", lead.getName(), stage.getName(), lead.getId());
        return CrmLeadResponse.fromEntity(lead);
    }

    @Transactional
    public CrmLeadResponse convertToProject(UUID leadId, ConvertToProjectRequest request) {
        CrmLead lead = getLeadOrThrow(leadId);

        if (lead.getStatus() != LeadStatus.WON) {
            throw new IllegalStateException("Конвертировать в проект можно только выигранный лид");
        }

        if (lead.getProjectId() != null) {
            throw new IllegalStateException("Лид уже связан с проектом");
        }

        lead.setProjectId(request.projectId());
        lead = leadRepository.save(lead);
        auditService.logUpdate("CrmLead", lead.getId(), "projectId", null, request.projectId().toString());

        log.info("CRM lead {} converted to project {} ({})", lead.getName(), request.projectId(), lead.getId());
        return CrmLeadResponse.fromEntity(lead);
    }

    @Transactional
    public CrmLeadResponse markAsWon(UUID leadId) {
        CrmLead lead = getLeadOrThrow(leadId);

        if (!lead.isOpen()) {
            throw new IllegalStateException("Лид уже закрыт");
        }

        LeadStatus oldStatus = lead.getStatus();
        lead.setStatus(LeadStatus.WON);
        lead.setWonDate(LocalDate.now());
        lead.setProbability(100);
        lead = leadRepository.save(lead);
        auditService.logStatusChange("CrmLead", lead.getId(), oldStatus.name(), LeadStatus.WON.name());

        log.info("CRM lead marked as won: {} ({})", lead.getName(), lead.getId());
        return CrmLeadResponse.fromEntity(lead);
    }

    @Transactional
    public CrmLeadResponse markAsLost(UUID leadId, String reason) {
        CrmLead lead = getLeadOrThrow(leadId);

        if (!lead.isOpen()) {
            throw new IllegalStateException("Лид уже закрыт");
        }

        LeadStatus oldStatus = lead.getStatus();
        lead.setStatus(LeadStatus.LOST);
        lead.setLostReason(reason);
        lead.setProbability(0);
        lead = leadRepository.save(lead);
        auditService.logStatusChange("CrmLead", lead.getId(), oldStatus.name(), LeadStatus.LOST.name());

        log.info("CRM lead marked as lost: {} - {} ({})", lead.getName(), reason, lead.getId());
        return CrmLeadResponse.fromEntity(lead);
    }

    @Transactional
    public void deleteLead(UUID id) {
        CrmLead lead = getLeadOrThrow(id);
        lead.softDelete();
        leadRepository.save(lead);
        auditService.logDelete("CrmLead", id);
        log.info("CRM lead deleted: {} ({})", lead.getName(), id);
    }

    // ===================== Stages =====================

    @Transactional(readOnly = true)
    public List<CrmStageResponse> listStages() {
        return stageRepository.findByDeletedFalseOrderBySequenceAsc()
                .stream()
                .map(CrmStageResponse::fromEntity)
                .toList();
    }

    @Transactional
    public CrmStageResponse createStage(CreateCrmStageRequest request) {
        CrmStage stage = CrmStage.builder()
                .name(request.name())
                .sequence(request.sequence())
                .probability(request.probability())
                .closed(request.closed() != null ? request.closed() : false)
                .won(request.won() != null ? request.won() : false)
                .requirements(request.requirements())
                .build();

        stage = stageRepository.save(stage);
        auditService.logCreate("CrmStage", stage.getId());

        log.info("CRM stage created: {} ({})", stage.getName(), stage.getId());
        return CrmStageResponse.fromEntity(stage);
    }

    // ===================== Teams =====================

    @Transactional(readOnly = true)
    public List<CrmTeamResponse> listTeams() {
        return teamRepository.findByActiveTrueAndDeletedFalseOrderByNameAsc()
                .stream()
                .map(CrmTeamResponse::fromEntity)
                .toList();
    }

    @Transactional
    public CrmTeamResponse createTeam(CreateCrmTeamRequest request) {
        CrmTeam team = CrmTeam.builder()
                .name(request.name())
                .leaderId(request.leaderId())
                .memberIds(request.memberIds())
                .targetRevenue(request.targetRevenue())
                .color(request.color())
                .active(true)
                .build();

        team = teamRepository.save(team);
        auditService.logCreate("CrmTeam", team.getId());

        log.info("CRM team created: {} ({})", team.getName(), team.getId());
        return CrmTeamResponse.fromEntity(team);
    }

    // ===================== Activities =====================

    @Transactional(readOnly = true)
    public List<CrmActivityResponse> getLeadActivities(UUID leadId) {
        getLeadOrThrow(leadId);
        return activityRepository.findByLeadIdAndDeletedFalseOrderByScheduledAtDesc(leadId)
                .stream()
                .map(CrmActivityResponse::fromEntity)
                .toList();
    }

    @Transactional
    public CrmActivityResponse createActivity(CreateCrmActivityRequest request) {
        getLeadOrThrow(request.leadId());

        CrmActivity activity = CrmActivity.builder()
                .leadId(request.leadId())
                .activityType(request.activityType())
                .userId(request.userId())
                .summary(request.summary())
                .notes(request.notes())
                .scheduledAt(request.scheduledAt())
                .build();

        activity = activityRepository.save(activity);
        auditService.logCreate("CrmActivity", activity.getId());

        log.info("CRM activity created: {} for lead {} ({})",
                activity.getActivityType(), request.leadId(), activity.getId());
        return CrmActivityResponse.fromEntity(activity);
    }

    @Transactional
    public CrmActivityResponse completeActivity(UUID activityId, String result) {
        CrmActivity activity = activityRepository.findById(activityId)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Активность CRM не найдена: " + activityId));

        if (activity.isCompleted()) {
            throw new IllegalStateException("Активность уже завершена");
        }

        activity.setCompletedAt(LocalDateTime.now());
        activity.setResult(result);
        activity = activityRepository.save(activity);

        log.info("CRM activity completed: {} ({})", activity.getActivityType(), activityId);
        return CrmActivityResponse.fromEntity(activity);
    }

    // ===================== Pipeline Stats =====================

    @Transactional(readOnly = true)
    public CrmPipelineResponse getPipelineStats() {
        Map<String, Long> statusCounts = new HashMap<>();
        List<Object[]> statusData = leadRepository.countByStatus();
        long total = 0;
        long open = 0;
        long won = 0;
        long lost = 0;

        for (Object[] row : statusData) {
            LeadStatus s = (LeadStatus) row[0];
            Long count = (Long) row[1];
            statusCounts.put(s.name(), count);
            total += count;
            if (s == LeadStatus.WON) won = count;
            else if (s == LeadStatus.LOST) lost = count;
            else open += count;
        }

        Map<String, Long> stageCounts = new HashMap<>();
        List<Object[]> stageData = leadRepository.countByStage();
        for (Object[] row : stageData) {
            UUID stageId = (UUID) row[0];
            Long count = (Long) row[1];
            stageCounts.put(stageId != null ? stageId.toString() : "unassigned", count);
        }

        BigDecimal pipelineRevenue = leadRepository.sumPipelineRevenue();
        BigDecimal weightedRevenue = leadRepository.sumWeightedPipelineRevenue();
        BigDecimal wonRevenue = leadRepository.sumWonRevenue();

        return new CrmPipelineResponse(
                total,
                statusCounts,
                stageCounts,
                pipelineRevenue != null ? pipelineRevenue : BigDecimal.ZERO,
                weightedRevenue != null ? weightedRevenue : BigDecimal.ZERO,
                wonRevenue != null ? wonRevenue : BigDecimal.ZERO,
                open,
                won,
                lost
        );
    }

    // ===================== Helpers =====================

    private CrmLead getLeadOrThrow(UUID id) {
        return leadRepository.findById(id)
                .filter(l -> !l.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Лид CRM не найден: " + id));
    }
}
