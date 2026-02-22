package com.privod.platform.modules.analytics.web.dto;

public record FieldInfo(
        String name,
        String label,
        FieldType type,
        boolean filterable,
        boolean sortable,
        boolean groupable
) {
    public enum FieldType {
        STRING,
        NUMBER,
        DATE,
        BOOLEAN
    }
}
