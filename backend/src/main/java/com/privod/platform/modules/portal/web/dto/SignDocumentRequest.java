package com.privod.platform.modules.portal.web.dto;

public record SignDocumentRequest(
        String signatureData,
        boolean accepted
) {
}
