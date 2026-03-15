package com.privod.platform.modules.hr.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkImportResult {
    private int total;
    private int created;
    private int skipped;
    private int failed;

    @Builder.Default
    private List<String> errors = new ArrayList<>();

    public void addError(String error) {
        if (errors == null) errors = new ArrayList<>();
        errors.add(error);
    }
}
