package com.privod.platform.modules.document.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.CustomUserDetails;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.document.domain.DrawingMarkup;
import com.privod.platform.modules.document.repository.DrawingMarkupRepository;
import com.privod.platform.modules.document.web.dto.CreateDrawingMarkupRequest;
import com.privod.platform.modules.document.web.dto.DrawingMarkupResponse;
import com.privod.platform.modules.document.web.dto.UpdateDrawingMarkupRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DrawingMarkupService {

    private final DrawingMarkupRepository markupRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<DrawingMarkupResponse> listMarkups(UUID documentId, Integer pageNumber) {
        if (pageNumber != null) {
            return markupRepository.findByDocumentIdAndPageNumberAndDeletedFalse(documentId, pageNumber)
                    .stream()
                    .map(DrawingMarkupResponse::fromEntity)
                    .toList();
        }
        return markupRepository.findByDocumentIdAndDeletedFalseOrderByCreatedAtDesc(documentId)
                .stream()
                .map(DrawingMarkupResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public DrawingMarkupResponse getMarkup(UUID documentId, UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        DrawingMarkup markup = getMarkupOrThrow(id, organizationId);
        if (!markup.getDocumentId().equals(documentId)) {
            throw new EntityNotFoundException("Разметка не найдена: " + id);
        }
        return DrawingMarkupResponse.fromEntity(markup);
    }

    @Transactional
    public DrawingMarkupResponse createMarkup(UUID documentId, CreateDrawingMarkupRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        String authorName = SecurityUtils.getCurrentUserDetails()
                .map(CustomUserDetails::getFullName)
                .orElse(null);

        DrawingMarkup markup = DrawingMarkup.builder()
                .organizationId(organizationId)
                .documentId(documentId)
                .pageNumber(request.pageNumber())
                .markupType(request.markupType())
                .x(request.x() != null ? request.x() : BigDecimal.ZERO)
                .y(request.y() != null ? request.y() : BigDecimal.ZERO)
                .width(request.width())
                .height(request.height())
                .rotation(request.rotation() != null ? request.rotation() : BigDecimal.ZERO)
                .color(request.color() != null ? request.color() : "#FF0000")
                .strokeWidth(request.strokeWidth() != null ? request.strokeWidth() : 2)
                .textContent(request.textContent())
                .authorName(authorName)
                .status("ACTIVE")
                .build();

        markup = markupRepository.save(markup);
        auditService.logCreate("DrawingMarkup", markup.getId());

        log.info("Drawing markup created on document {} page {}: {} ({})",
                documentId, request.pageNumber(), request.markupType(), markup.getId());
        return DrawingMarkupResponse.fromEntity(markup);
    }

    @Transactional
    public DrawingMarkupResponse updateMarkup(UUID documentId, UUID id, UpdateDrawingMarkupRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        DrawingMarkup markup = getMarkupOrThrow(id, organizationId);

        if (!markup.getDocumentId().equals(documentId)) {
            throw new EntityNotFoundException("Разметка не найдена: " + id);
        }

        if (request.markupType() != null) {
            markup.setMarkupType(request.markupType());
        }
        if (request.pageNumber() != null) {
            markup.setPageNumber(request.pageNumber());
        }
        if (request.x() != null) {
            markup.setX(request.x());
        }
        if (request.y() != null) {
            markup.setY(request.y());
        }
        if (request.width() != null) {
            markup.setWidth(request.width());
        }
        if (request.height() != null) {
            markup.setHeight(request.height());
        }
        if (request.rotation() != null) {
            markup.setRotation(request.rotation());
        }
        if (request.color() != null) {
            markup.setColor(request.color());
        }
        if (request.strokeWidth() != null) {
            markup.setStrokeWidth(request.strokeWidth());
        }
        if (request.textContent() != null) {
            markup.setTextContent(request.textContent());
        }
        if (request.status() != null) {
            markup.setStatus(request.status());
        }

        markup = markupRepository.save(markup);
        auditService.logUpdate("DrawingMarkup", markup.getId(), "multiple", null, null);

        log.info("Drawing markup updated: {} ({})", markup.getMarkupType(), markup.getId());
        return DrawingMarkupResponse.fromEntity(markup);
    }

    @Transactional
    public void deleteMarkup(UUID documentId, UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        DrawingMarkup markup = getMarkupOrThrow(id, organizationId);

        if (!markup.getDocumentId().equals(documentId)) {
            throw new EntityNotFoundException("Разметка не найдена: " + id);
        }

        markup.softDelete();
        markupRepository.save(markup);
        auditService.logDelete("DrawingMarkup", markup.getId());

        log.info("Drawing markup soft-deleted: {} ({})", markup.getMarkupType(), markup.getId());
    }

    private DrawingMarkup getMarkupOrThrow(UUID id, UUID organizationId) {
        return markupRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Разметка не найдена: " + id));
    }
}
