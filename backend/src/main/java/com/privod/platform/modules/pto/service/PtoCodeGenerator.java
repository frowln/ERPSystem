package com.privod.platform.modules.pto.service;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class PtoCodeGenerator {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");
    private final AtomicLong counter = new AtomicLong(System.currentTimeMillis() % 100000);

    public String generateDocumentCode() {
        return "DOC-" + LocalDate.now().format(DATE_FMT) + "-" + String.format("%05d", counter.incrementAndGet());
    }

    public String generateWorkPermitCode() {
        return "WP-" + LocalDate.now().format(DATE_FMT) + "-" + String.format("%05d", counter.incrementAndGet());
    }

    public String generateActCode() {
        return "ACT-" + LocalDate.now().format(DATE_FMT) + "-" + String.format("%05d", counter.incrementAndGet());
    }

    public String generateSchemeCode() {
        return "ES-" + LocalDate.now().format(DATE_FMT) + "-" + String.format("%05d", counter.incrementAndGet());
    }

    public String generateTechSolutionCode() {
        return "TS-" + LocalDate.now().format(DATE_FMT) + "-" + String.format("%05d", counter.incrementAndGet());
    }

    public String generateLabTestCode() {
        return "LT-" + LocalDate.now().format(DATE_FMT) + "-" + String.format("%05d", counter.incrementAndGet());
    }

    public String generateSubmittalCode() {
        return "SUB-" + LocalDate.now().format(DATE_FMT) + "-" + String.format("%05d", counter.incrementAndGet());
    }

    public String generateAsBuiltCode() {
        return "AB-" + LocalDate.now().format(DATE_FMT) + "-" + String.format("%05d", counter.incrementAndGet());
    }

    public String generateQualityPlanCode() {
        return "QP-" + LocalDate.now().format(DATE_FMT) + "-" + String.format("%05d", counter.incrementAndGet());
    }
}
