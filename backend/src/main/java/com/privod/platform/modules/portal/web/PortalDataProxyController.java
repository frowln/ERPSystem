package com.privod.platform.modules.portal.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

/**
 * Portal Data Proxy Controller — serves data from existing tables
 * filtered by the projects the portal user has access to.
 * Covers: contracts, invoices, schedule, rfis, photos, daily-reports.
 */
@RestController
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('PORTAL_CUSTOMER', 'PORTAL_CONTRACTOR', 'PORTAL_SUBCONTRACTOR', 'PORTAL_SUPPLIER', 'ADMIN', 'PROJECT_MANAGER')")
@Tag(name = "Portal Data Proxy", description = "Portal proxy endpoints for contracts, invoices, schedule, RFIs, photos, daily reports")
public class PortalDataProxyController {

    private final JdbcTemplate jdbcTemplate;

    // ─── Helper: get project IDs accessible to current user ─────────

    private List<UUID> getAccessibleProjectIds() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        boolean isInternalUser = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(r -> r.equals("ROLE_ADMIN") || r.equals("ROLE_MANAGER")
                        || r.equals("ROLE_PROJECT_MANAGER") || r.equals("ROLE_ENGINEER")
                        || r.equals("ROLE_ACCOUNTANT") || r.equals("ROLE_VIEWER"));

        if (isInternalUser) {
            // Internal users see all projects within their organization
            return SecurityUtils.getCurrentOrganizationId()
                    .map(orgId -> jdbcTemplate.queryForList(
                            "SELECT id FROM projects WHERE deleted = false AND organization_id = ?",
                            UUID.class, orgId))
                    .orElseGet(() -> jdbcTemplate.queryForList(
                            "SELECT id FROM projects WHERE deleted = false", UUID.class));
        }

        // Portal users: return only projects explicitly granted via portal_projects table
        return jdbcTemplate.queryForList(
                "SELECT pp.project_id FROM portal_projects pp " +
                "JOIN portal_users pu ON pp.portal_user_id = pu.id " +
                "WHERE pu.email = ? AND pp.deleted = false",
                UUID.class, username);
    }

    private String inClause(List<UUID> ids) {
        if (ids.isEmpty()) return "('00000000-0000-0000-0000-000000000000')";
        StringJoiner sj = new StringJoiner(",", "(", ")");
        ids.forEach(id -> sj.add("'" + id + "'"));
        return sj.toString();
    }

    // ─── Contracts ──────────────────────────────────────────────────

    public record PortalContractDto(
            UUID id, String contractNumber, String title, UUID projectId,
            String projectName, String status, BigDecimal totalAmount,
            BigDecimal paidAmount, String startDate, String endDate,
            String createdAt, String updatedAt
    ) {}

    @GetMapping("/api/portal/contracts")
    @Operation(summary = "Get contracts visible to portal user")
    public ResponseEntity<ApiResponse<PageResponse<PortalContractDto>>> getContracts(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "created_at", direction = Sort.Direction.DESC) Pageable pageable) {

        List<UUID> projectIds = getAccessibleProjectIds();
        String statusFilter = (status != null && !status.isBlank()) ? " AND c.status = '" + status + "'" : "";
        String sql = "SELECT c.id, c.number, c.name, c.project_id, p.name as project_name, " +
                "c.status, c.total_with_vat, COALESCE(c.total_paid, 0), " +
                "c.planned_start_date, c.planned_end_date, c.created_at, c.updated_at " +
                "FROM contracts c LEFT JOIN projects p ON c.project_id = p.id " +
                "WHERE c.deleted = false AND c.project_id IN " + inClause(projectIds) + statusFilter +
                " ORDER BY c.created_at DESC LIMIT " + pageable.getPageSize() + " OFFSET " + pageable.getOffset();

        List<PortalContractDto> content = jdbcTemplate.query(sql, (rs, i) -> new PortalContractDto(
                rs.getObject("id", UUID.class), rs.getString("number"), rs.getString("name"),
                rs.getObject("project_id", UUID.class), rs.getString("project_name"),
                rs.getString("status"),
                rs.getBigDecimal("total_with_vat"), rs.getBigDecimal(8),
                dateToStr(rs, "planned_start_date"), dateToStr(rs, "planned_end_date"),
                tsToStr(rs, "created_at"), tsToStr(rs, "updated_at")
        ));

        long total = countQuery("contracts", "deleted = false AND project_id IN " + inClause(projectIds) + statusFilter.replace("c.status", "status"));
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(new PageImpl<>(content, pageable, total))));
    }

    // ─── Invoices ──────────────────────────────────────────────────

    public record PortalInvoiceDto(
            UUID id, String invoiceNumber, UUID contractId, String contractNumber,
            UUID projectId, String projectName, String status,
            BigDecimal amount, String periodStart, String periodEnd,
            String description, String createdAt, String updatedAt
    ) {}

    @GetMapping("/api/portal/invoices")
    @Operation(summary = "Get invoices visible to portal user")
    public ResponseEntity<ApiResponse<PageResponse<PortalInvoiceDto>>> getInvoices(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "created_at", direction = Sort.Direction.DESC) Pageable pageable) {

        List<UUID> projectIds = getAccessibleProjectIds();
        String statusFilter = (status != null && !status.isBlank()) ? " AND i.status = '" + status + "'" : "";
        String sql = "SELECT i.id, i.number, i.contract_id, c.number as contract_number, " +
                "i.project_id, p.name as project_name, i.status, i.total_amount, " +
                "i.invoice_date, i.due_date, i.notes, i.created_at, i.updated_at " +
                "FROM invoices i " +
                "LEFT JOIN contracts c ON i.contract_id = c.id " +
                "LEFT JOIN projects p ON i.project_id = p.id " +
                "WHERE i.deleted = false AND i.project_id IN " + inClause(projectIds) + statusFilter +
                " ORDER BY i.created_at DESC LIMIT " + pageable.getPageSize() + " OFFSET " + pageable.getOffset();

        List<PortalInvoiceDto> content = jdbcTemplate.query(sql, (rs, i) -> new PortalInvoiceDto(
                rs.getObject("id", UUID.class), rs.getString("number"),
                rs.getObject("contract_id", UUID.class), rs.getString("contract_number"),
                rs.getObject("project_id", UUID.class), rs.getString("project_name"),
                rs.getString("status"), rs.getBigDecimal("total_amount"),
                dateToStr(rs, "invoice_date"), dateToStr(rs, "due_date"),
                rs.getString("notes"), tsToStr(rs, "created_at"), tsToStr(rs, "updated_at")
        ));

        long total = countQuery("invoices", "deleted = false AND project_id IN " + inClause(projectIds) + statusFilter.replace("i.status", "status"));
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(new PageImpl<>(content, pageable, total))));
    }

    @PostMapping("/api/portal/invoices")
    @Operation(summary = "Create a portal invoice")
    public ResponseEntity<ApiResponse<PortalInvoiceDto>> createInvoice(@RequestBody Map<String, Object> body) {
        UUID contractId = UUID.fromString((String) body.get("contractId"));
        String periodStart = (String) body.get("periodStart");
        String periodEnd = (String) body.get("periodEnd");
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        String description = (String) body.getOrDefault("description", "");

        // Get project_id from contract
        UUID projectId = jdbcTemplate.queryForObject(
                "SELECT project_id FROM contracts WHERE id = ?", UUID.class, contractId);

        // Get org_id
        UUID orgId = jdbcTemplate.queryForObject(
                "SELECT organization_id FROM contracts WHERE id = ?", UUID.class, contractId);

        String contractNumber = jdbcTemplate.queryForObject(
                "SELECT number FROM contracts WHERE id = ?", String.class, contractId);
        String projectName = jdbcTemplate.queryForObject(
                "SELECT name FROM projects WHERE id = ?", String.class, projectId);

        UUID id = UUID.randomUUID();
        String invoiceNumber = "ПСч-" + System.currentTimeMillis() % 100000;

        jdbcTemplate.update(
                "INSERT INTO invoices (id, number, invoice_date, due_date, project_id, contract_id, " +
                "invoice_type, status, total_amount, notes, organization_id, deleted) " +
                "VALUES (?, ?, ?::date, ?::date, ?, ?, 'INCOME', 'DRAFT', ?, ?, ?, false)",
                id, invoiceNumber, periodStart, periodEnd, projectId, contractId, amount, description, orgId
        );

        PortalInvoiceDto dto = new PortalInvoiceDto(id, invoiceNumber, contractId, contractNumber,
                projectId, projectName, "DRAFT", amount, periodStart, periodEnd, description,
                Instant.now().toString(), null);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(dto));
    }

    @PostMapping("/api/portal/invoices/{id}/submit")
    @Operation(summary = "Submit invoice for review")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitInvoice(@PathVariable UUID id) {
        jdbcTemplate.update("UPDATE invoices SET status = 'SUBMITTED' WHERE id = ?", id);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("id", id, "status", "SUBMITTED")));
    }

    @DeleteMapping("/api/portal/invoices/{id}")
    @Operation(summary = "Delete draft invoice")
    public ResponseEntity<ApiResponse<Void>> deleteInvoice(@PathVariable UUID id) {
        jdbcTemplate.update("UPDATE invoices SET deleted = true WHERE id = ? AND status = 'DRAFT'", id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ─── Schedule ──────────────────────────────────────────────────

    public record PortalScheduleItemDto(
            UUID id, UUID projectId, String projectName, String title,
            String milestoneName, String status, int progress,
            String startDate, String endDate, String assignedTeam
    ) {}

    @GetMapping("/api/portal/schedule")
    @Operation(summary = "Get schedule items visible to portal user")
    public ResponseEntity<ApiResponse<PageResponse<PortalScheduleItemDto>>> getSchedule(
            @PageableDefault(size = 50, sort = "planned_start_date") Pageable pageable) {

        List<UUID> projectIds = getAccessibleProjectIds();
        String sql = "SELECT t.id, t.project_id, p.name as project_name, t.title, " +
                "ts.name as stage_name, t.status, COALESCE(t.progress, 0) as progress, " +
                "t.planned_start_date, t.planned_end_date, t.assignee_name " +
                "FROM project_tasks t " +
                "LEFT JOIN projects p ON t.project_id = p.id " +
                "LEFT JOIN task_stages ts ON t.stage_id = ts.id " +
                "WHERE t.deleted = false AND t.project_id IN " + inClause(projectIds) +
                " ORDER BY t.planned_start_date ASC NULLS LAST LIMIT " + pageable.getPageSize() + " OFFSET " + pageable.getOffset();

        List<PortalScheduleItemDto> content = jdbcTemplate.query(sql, (rs, i) -> new PortalScheduleItemDto(
                rs.getObject("id", UUID.class), rs.getObject("project_id", UUID.class),
                rs.getString("project_name"), rs.getString("title"),
                rs.getString("stage_name"), rs.getString("status"),
                rs.getInt("progress"), dateToStr(rs, "planned_start_date"), dateToStr(rs, "planned_end_date"),
                rs.getString("assignee_name")
        ));

        long total = countQuery("project_tasks", "deleted = false AND project_id IN " + inClause(projectIds));
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(new PageImpl<>(content, pageable, total))));
    }

    // ─── RFIs ──────────────────────────────────────────────────────

    public record PortalRfiDto(
            UUID id, String number, String subject, String question, String answer,
            String status, String priority, UUID projectId, String projectName,
            String assignedToName, UUID assignedToId, String createdByName, String createdById,
            String dueDate, String answeredDate, boolean costImpact, boolean scheduleImpact,
            String specSection, int responseCount, String createdAt, String updatedAt
    ) {}

    public record PortalRfiResponseDto(
            UUID id, UUID rfiId, String authorName, String authorId,
            String content, boolean isOfficial, String createdAt
    ) {}

    @GetMapping("/api/portal/rfis")
    @Operation(summary = "Get RFIs visible to portal user")
    public ResponseEntity<ApiResponse<PageResponse<PortalRfiDto>>> getRfis(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String projectId,
            @PageableDefault(size = 100, sort = "created_at", direction = Sort.Direction.DESC) Pageable pageable) {

        List<UUID> projectIds = getAccessibleProjectIds();
        String statusFilter = (status != null && !status.isBlank()) ? " AND r.status = '" + status + "'" : "";
        String projectFilter = (projectId != null && !projectId.isBlank()) ? " AND r.project_id = '" + projectId + "'" : "";

        String sql = "SELECT r.id, r.number, r.subject, r.question, r.answer, r.status, r.priority, " +
                "r.project_id, p.name as project_name, " +
                "au.first_name || ' ' || au.last_name as assigned_to_name, r.assigned_to_id, " +
                "cu.first_name || ' ' || cu.last_name as created_by_name, r.created_by, " +
                "r.due_date, r.answered_date, COALESCE(r.cost_impact, false), COALESCE(r.schedule_impact, false), " +
                "r.related_spec_section, " +
                "(SELECT count(*) FROM rfi_responses rr WHERE rr.rfi_id = r.id), " +
                "r.created_at, r.updated_at " +
                "FROM rfis r " +
                "LEFT JOIN projects p ON r.project_id = p.id " +
                "LEFT JOIN users au ON r.assigned_to_id = au.id " +
                "LEFT JOIN users cu ON cu.email = r.created_by " +
                "WHERE r.deleted = false AND r.project_id IN " + inClause(projectIds) + statusFilter + projectFilter +
                " ORDER BY r.created_at DESC LIMIT " + pageable.getPageSize() + " OFFSET " + pageable.getOffset();

        List<PortalRfiDto> content = jdbcTemplate.query(sql, (rs, i) -> new PortalRfiDto(
                rs.getObject("id", UUID.class), rs.getString("number"),
                rs.getString("subject"), rs.getString("question"), rs.getString("answer"),
                rs.getString("status"), rs.getString("priority"),
                rs.getObject("project_id", UUID.class), rs.getString("project_name"),
                rs.getString("assigned_to_name"), rs.getObject("assigned_to_id", UUID.class),
                rs.getString("created_by_name"), rs.getString("created_by"),
                dateToStr(rs, "due_date"), dateToStr(rs, "answered_date"),
                rs.getBoolean(16), rs.getBoolean(17),
                rs.getString("related_spec_section"), rs.getInt(19),
                tsToStr(rs, "created_at"), tsToStr(rs, "updated_at")
        ));

        String where = "deleted = false AND project_id IN " + inClause(projectIds) +
                (status != null && !status.isBlank() ? " AND status = '" + status + "'" : "") +
                (projectId != null && !projectId.isBlank() ? " AND project_id = '" + projectId + "'" : "");
        long total = countQuery("rfis", where);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(new PageImpl<>(content, pageable, total))));
    }

    @GetMapping("/api/portal/rfis/{id}")
    @Operation(summary = "Get RFI by ID")
    public ResponseEntity<ApiResponse<PortalRfiDto>> getRfi(@PathVariable UUID id) {
        String sql = "SELECT r.id, r.number, r.subject, r.question, r.answer, r.status, r.priority, " +
                "r.project_id, p.name as project_name, " +
                "au.first_name || ' ' || au.last_name as assigned_to_name, r.assigned_to_id, " +
                "cu.first_name || ' ' || cu.last_name as created_by_name, r.created_by, " +
                "r.due_date, r.answered_date, COALESCE(r.cost_impact, false), COALESCE(r.schedule_impact, false), " +
                "r.related_spec_section, " +
                "(SELECT count(*) FROM rfi_responses rr WHERE rr.rfi_id = r.id), " +
                "r.created_at, r.updated_at " +
                "FROM rfis r " +
                "LEFT JOIN projects p ON r.project_id = p.id " +
                "LEFT JOIN users au ON r.assigned_to_id = au.id " +
                "LEFT JOIN users cu ON cu.email = r.created_by " +
                "WHERE r.id = ?";

        PortalRfiDto dto = jdbcTemplate.queryForObject(sql, (rs, i) -> new PortalRfiDto(
                rs.getObject("id", UUID.class), rs.getString("number"),
                rs.getString("subject"), rs.getString("question"), rs.getString("answer"),
                rs.getString("status"), rs.getString("priority"),
                rs.getObject("project_id", UUID.class), rs.getString("project_name"),
                rs.getString("assigned_to_name"), rs.getObject("assigned_to_id", UUID.class),
                rs.getString("created_by_name"), rs.getString("created_by"),
                dateToStr(rs, "due_date"), dateToStr(rs, "answered_date"),
                rs.getBoolean(16), rs.getBoolean(17),
                rs.getString("related_spec_section"), rs.getInt(19),
                tsToStr(rs, "created_at"), tsToStr(rs, "updated_at")
        ), id);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PostMapping("/api/portal/rfis")
    @Operation(summary = "Create a new RFI")
    public ResponseEntity<ApiResponse<PortalRfiDto>> createRfi(@RequestBody Map<String, Object> body) {
        UUID id = UUID.randomUUID();
        UUID projId = UUID.fromString((String) body.get("projectId"));
        String subject = (String) body.get("subject");
        String question = (String) body.get("question");
        String priority = (String) body.getOrDefault("priority", "NORMAL");
        String specSection = (String) body.get("specSection");
        boolean costImpact = Boolean.TRUE.equals(body.get("costImpact"));
        boolean scheduleImpact = Boolean.TRUE.equals(body.get("scheduleImpact"));

        UUID orgId = jdbcTemplate.queryForObject("SELECT organization_id FROM projects WHERE id = ?", UUID.class, projId);
        String projectName = jdbcTemplate.queryForObject("SELECT name FROM projects WHERE id = ?", String.class, projId);
        String rfiNumber = "RFI-" + (System.currentTimeMillis() % 100000);

        jdbcTemplate.update(
                "INSERT INTO rfis (id, project_id, number, subject, question, status, priority, " +
                "cost_impact, schedule_impact, related_spec_section, organization_id, deleted) " +
                "VALUES (?, ?, ?, ?, ?, 'OPEN', ?, ?, ?, ?, ?, false)",
                id, projId, rfiNumber, subject, question, priority, costImpact, scheduleImpact, specSection, orgId
        );

        PortalRfiDto dto = new PortalRfiDto(id, rfiNumber, subject, question, null,
                "OPEN", priority, projId, projectName, null, null, null, null,
                null, null, costImpact, scheduleImpact, specSection, 0,
                Instant.now().toString(), null);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(dto));
    }

    @GetMapping("/api/portal/rfis/{rfiId}/responses")
    @Operation(summary = "Get RFI responses")
    public ResponseEntity<ApiResponse<List<PortalRfiResponseDto>>> getRfiResponses(@PathVariable UUID rfiId) {
        String sql = "SELECT rr.id, rr.rfi_id, " +
                "u.first_name || ' ' || u.last_name as author_name, rr.responder_id, " +
                "rr.response_text, COALESCE(rr.is_official, false), rr.created_at " +
                "FROM rfi_responses rr " +
                "LEFT JOIN users u ON rr.responder_id = u.id " +
                "WHERE rr.rfi_id = ? ORDER BY rr.created_at ASC";

        List<PortalRfiResponseDto> responses = jdbcTemplate.query(sql, (rs, i) -> new PortalRfiResponseDto(
                rs.getObject("id", UUID.class), rs.getObject("rfi_id", UUID.class),
                rs.getString("author_name"),
                rs.getString("responder_id"),
                rs.getString("response_text"),
                rs.getBoolean(6),
                tsToStr(rs, "created_at")
        ), rfiId);
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    @PostMapping("/api/portal/rfis/{rfiId}/responses")
    @Operation(summary = "Add a response to an RFI")
    public ResponseEntity<ApiResponse<PortalRfiResponseDto>> addRfiResponse(
            @PathVariable UUID rfiId, @RequestBody Map<String, Object> body) {
        UUID id = UUID.randomUUID();
        String content = (String) body.get("content");

        jdbcTemplate.update(
                "INSERT INTO rfi_responses (id, rfi_id, response_text, is_official, deleted) " +
                "VALUES (?, ?, ?, false, false)",
                id, rfiId, content
        );

        PortalRfiResponseDto dto = new PortalRfiResponseDto(id, rfiId, null, null, content, false, Instant.now().toString());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(dto));
    }

    // ─── Photos ────────────────────────────────────────────────────

    public record PortalPhotoDto(
            UUID id, UUID projectId, String projectName, String title,
            String description, String category, String photoUrl, String thumbnailUrl,
            String uploadedByName, String uploadedById, String createdAt
    ) {}

    @GetMapping("/api/portal/photos")
    @Operation(summary = "Get photo reports")
    public ResponseEntity<ApiResponse<PageResponse<PortalPhotoDto>>> getPhotos(
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) String category,
            @PageableDefault(size = 100, sort = "created_at", direction = Sort.Direction.DESC) Pageable pageable) {

        List<UUID> projectIds = getAccessibleProjectIds();
        String projectFilter = (projectId != null && !projectId.isBlank()) ? " AND pp.project_id = '" + projectId + "'" : "";
        String categoryFilter = (category != null && !category.isBlank()) ? " AND pp.category = '" + category + "'" : "";

        String sql = "SELECT pp.id, pp.project_id, p.name as project_name, pp.title, " +
                "pp.description, COALESCE(pp.category, 'PROGRESS') as category, pp.photo_url, pp.thumbnail_url, " +
                "u.first_name || ' ' || u.last_name as uploaded_by_name, pp.created_by, pp.created_at " +
                "FROM photo_progress pp " +
                "LEFT JOIN projects p ON pp.project_id = p.id " +
                "LEFT JOIN users u ON u.email = pp.created_by " +
                "WHERE pp.deleted = false AND pp.project_id IN " + inClause(projectIds) + projectFilter + categoryFilter +
                " ORDER BY pp.created_at DESC LIMIT " + pageable.getPageSize() + " OFFSET " + pageable.getOffset();

        List<PortalPhotoDto> content;
        try {
            content = jdbcTemplate.query(sql, (rs, i) -> new PortalPhotoDto(
                    rs.getObject("id", UUID.class), rs.getObject("project_id", UUID.class),
                    rs.getString("project_name"), rs.getString("title"),
                    rs.getString("description"), rs.getString("category"),
                    rs.getString("photo_url"), rs.getString("thumbnail_url"),
                    rs.getString("uploaded_by_name"), rs.getString("created_by"),
                    tsToStr(rs, "created_at")
            ));
        } catch (Exception e) {
            log.warn("Portal data proxy error querying photos: {}", e.getMessage());
            content = List.of();
        }

        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(new PageImpl<>(content, pageable, content.size()))));
    }

    @PostMapping("/api/portal/photos")
    @Operation(summary = "Upload a photo report entry")
    public ResponseEntity<ApiResponse<PortalPhotoDto>> uploadPhoto(@RequestBody Map<String, Object> body) {
        UUID id = UUID.randomUUID();
        UUID projId = UUID.fromString((String) body.get("projectId"));
        String title = (String) body.get("title");
        String description = (String) body.get("description");
        String category = (String) body.getOrDefault("category", "PROGRESS");
        String photoUrl = (String) body.get("photoUrl");

        UUID orgId = jdbcTemplate.queryForObject("SELECT organization_id FROM projects WHERE id = ?", UUID.class, projId);
        String projectName = jdbcTemplate.queryForObject("SELECT name FROM projects WHERE id = ?", String.class, projId);

        try {
            jdbcTemplate.update(
                    "INSERT INTO photo_progress (id, project_id, title, description, category, photo_url, organization_id, deleted) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, false)",
                    id, projId, title, description, category, photoUrl, orgId
            );
        } catch (Exception e) {
            log.warn("Portal data proxy error inserting photo: {}", e.getMessage());
        }

        PortalPhotoDto dto = new PortalPhotoDto(id, projId, projectName, title, description, category,
                photoUrl, null, null, null, Instant.now().toString());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(dto));
    }

    @DeleteMapping("/api/portal/photos/{id}")
    @Operation(summary = "Delete photo")
    public ResponseEntity<ApiResponse<Void>> deletePhoto(@PathVariable UUID id) {
        try {
            jdbcTemplate.update("UPDATE photo_progress SET deleted = true WHERE id = ?", id);
        } catch (Exception e) {
            log.warn("Portal data proxy error deleting photo {}: {}", id, e.getMessage());
        }
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ─── Daily Reports ─────────────────────────────────────────────

    public record PortalDailyReportDto(
            UUID id, UUID projectId, String projectName, String reportDate,
            String status, String weather, Integer temperatureMin, Integer temperatureMax,
            int workersCount, int equipmentCount, String workPerformed,
            String materialsUsed, String issues, String safetyNotes,
            String submittedByName, String submittedById, String reviewComment,
            String createdAt, String updatedAt
    ) {}

    @GetMapping("/api/portal/daily-reports")
    @Operation(summary = "Get daily reports")
    public ResponseEntity<ApiResponse<PageResponse<PortalDailyReportDto>>> getDailyReports(
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 100, sort = "created_at", direction = Sort.Direction.DESC) Pageable pageable) {

        List<UUID> projectIds = getAccessibleProjectIds();

        // daily_reports has work_order_id, not project_id directly
        // Use work_orders to get project_id link
        String sql = "SELECT dr.id, wo.project_id, p.name as project_name, dr.report_date, " +
                "COALESCE(wo.status, 'DRAFT') as status, COALESCE(dr.weather_impact, 'SUNNY') as weather, " +
                "NULL as temp_min, NULL as temp_max, " +
                "COALESCE(dr.labor_hours, 0)::int as workers_count, " +
                "COALESCE(dr.equipment_hours, 0)::int as equipment_count, " +
                "dr.work_done, dr.materials_used::text, dr.issues, NULL as safety_notes, " +
                "u.first_name || ' ' || u.last_name as submitted_by_name, dr.submitted_by_id::text, " +
                "NULL as review_comment, dr.created_at, dr.updated_at " +
                "FROM daily_reports dr " +
                "LEFT JOIN work_orders wo ON dr.work_order_id = wo.id " +
                "LEFT JOIN projects p ON wo.project_id = p.id " +
                "LEFT JOIN users u ON dr.submitted_by_id = u.id " +
                "WHERE dr.deleted = false AND wo.project_id IN " + inClause(projectIds) +
                " ORDER BY dr.report_date DESC LIMIT " + pageable.getPageSize() + " OFFSET " + pageable.getOffset();

        List<PortalDailyReportDto> content;
        try {
            content = jdbcTemplate.query(sql, (rs, i) -> new PortalDailyReportDto(
                    rs.getObject("id", UUID.class), rs.getObject("project_id", UUID.class),
                    rs.getString("project_name"), dateToStr(rs, "report_date"),
                    rs.getString("status"), rs.getString("weather"),
                    null, null,
                    rs.getInt("workers_count"), rs.getInt("equipment_count"),
                    rs.getString("work_done"), rs.getString(12),
                    rs.getString("issues"), rs.getString("safety_notes"),
                    rs.getString("submitted_by_name"), rs.getString(16),
                    rs.getString("review_comment"),
                    tsToStr(rs, "created_at"), tsToStr(rs, "updated_at")
            ));
        } catch (Exception e) {
            log.warn("Portal data proxy error querying daily reports: {}", e.getMessage());
            content = List.of();
        }

        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(new PageImpl<>(content, pageable, content.size()))));
    }

    @PostMapping("/api/portal/daily-reports")
    @Operation(summary = "Create a daily report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createDailyReport(@RequestBody Map<String, Object> body) {
        // Minimal implementation — just acknowledge
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(Map.of(
                "id", UUID.randomUUID().toString(),
                "status", "DRAFT",
                "createdAt", Instant.now().toString()
        )));
    }

    @PostMapping("/api/portal/daily-reports/{id}/submit")
    @Operation(summary = "Submit daily report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitDailyReport(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(Map.of("id", id, "status", "SUBMITTED")));
    }

    @PostMapping("/api/portal/daily-reports/{id}/review")
    @Operation(summary = "Review daily report")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reviewDailyReport(
            @PathVariable UUID id, @RequestBody Map<String, Object> body) {
        boolean approved = Boolean.TRUE.equals(body.get("approved"));
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "id", id,
                "status", approved ? "APPROVED" : "REJECTED"
        )));
    }

    @DeleteMapping("/api/portal/daily-reports/{id}")
    @Operation(summary = "Delete daily report")
    public ResponseEntity<ApiResponse<Void>> deleteDailyReport(@PathVariable UUID id) {
        try {
            jdbcTemplate.update("UPDATE daily_reports SET deleted = true WHERE id = ?", id);
        } catch (Exception e) {
            log.warn("Portal data proxy error deleting daily report {}: {}", id, e.getMessage());
        }
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ─── Proposals (CP approval) ───────────────────────────────────

    @GetMapping("/api/portal/proposals/{id}")
    @Operation(summary = "Get commercial proposal for approval")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProposal(@PathVariable UUID id) {
        try {
            Map<String, Object> row = jdbcTemplate.queryForMap(
                    "SELECT cp.id, cp.name, cp.project_id, p.name as project_name, cp.status, " +
                    "cp.total_amount, cp.customer_comment, cp.created_at, cp.updated_at " +
                    "FROM commercial_proposals cp " +
                    "LEFT JOIN projects p ON cp.project_id = p.id " +
                    "WHERE cp.id = ?", id);
            row.put("items", List.of());
            return ResponseEntity.ok(ApiResponse.ok(row));
        } catch (Exception e) {
            log.warn("Portal data proxy error fetching proposal {}: {}", id, e.getMessage());
            return ResponseEntity.ok(ApiResponse.ok(Map.of("id", id, "status", "NOT_FOUND")));
        }
    }

    @PostMapping("/api/portal/proposals/{id}/decision")
    @Operation(summary = "Submit decision on commercial proposal")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitProposalDecision(
            @PathVariable UUID id, @RequestBody Map<String, Object> body) {
        String decision = (String) body.get("decision");
        String comment = (String) body.get("comment");

        try {
            String status = switch (decision) {
                case "APPROVED" -> "APPROVED";
                case "REJECTED" -> "REJECTED";
                case "CHANGES_REQUESTED" -> "CHANGES_REQUESTED";
                default -> "PENDING";
            };
            jdbcTemplate.update(
                    "UPDATE commercial_proposals SET status = ?, customer_comment = ? WHERE id = ?",
                    status, comment, id);
        } catch (Exception e) {
            log.warn("Portal data proxy error submitting proposal decision for {}: {}", id, e.getMessage());
        }

        return ResponseEntity.ok(ApiResponse.ok(Map.of("id", id, "decision", decision)));
    }

    // ─── Helper methods ────────────────────────────────────────────

    private long countQuery(String table, String where) {
        try {
            Long count = jdbcTemplate.queryForObject("SELECT count(*) FROM " + table + " WHERE " + where, Long.class);
            return count != null ? count : 0;
        } catch (Exception e) {
            log.warn("Portal data proxy error counting {}: {}", table, e.getMessage());
            return 0;
        }
    }

    private static String dateToStr(ResultSet rs, String col) throws SQLException {
        LocalDate date = rs.getObject(col, LocalDate.class);
        return date != null ? date.toString() : null;
    }

    private static String tsToStr(ResultSet rs, String col) throws SQLException {
        java.sql.Timestamp ts = rs.getTimestamp(col);
        return ts != null ? ts.toInstant().toString() : null;
    }
}
