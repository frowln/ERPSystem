package com.privod.platform.modules.hr.web.dto;

import lombok.Data;

@Data
public class EmployeeImportRow {
    private String lastName;
    private String firstName;
    private String middleName;
    private String position;
    private String department;
    private String personnelNumber;
    private String inn;
    private String snils;
    private String email;
    private String phone;
}
