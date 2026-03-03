package com.asagents.procurement.compliance.model;

import java.util.ArrayList;
import java.util.List;

public class CPVCodeValidation {
    private String code;
    private boolean valid;
    private String description;
    private String category;
    private List<String> issues = new ArrayList<>();

    public String getCode() {
        return code;
    }
    public void setCode(String code) {
        this.code = code;
    }
    public boolean isValid() {
        return valid;
    }
    public void setValid(boolean valid) {
        this.valid = valid;
    }
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }
    public String getCategory() {
        return category;
    }
    public void setCategory(String category) {
        this.category = category;
    }
    public List<String> getIssues() {
        return issues;
    }
    public void setIssues(List<String> issues) {
        this.issues = issues != null ? issues : new ArrayList<>();
    }
    public void addIssue(String issue) {
        this.issues.add(issue);
    }
}