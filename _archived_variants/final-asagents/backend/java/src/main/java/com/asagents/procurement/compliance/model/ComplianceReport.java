package com.asagents.procurement.compliance.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Comprehensive compliance report for UK Procurement Act 2023 analysis.
 */
public class ComplianceReport {

    private Long opportunityId;
    private LocalDateTime checkDate;
    private List<String> applicableRegulations;
    private ThresholdAnalysis thresholdAnalysis;
    private CPVValidation cpvValidation;
    private DocumentationRequirements documentationRequirements;
    private PA2023Compliance pa2023Compliance;
    private CladdingCompliance claddingCompliance;
    private int overallScore;
    private String riskLevel;
    private List<ComplianceRecommendation> recommendations;

    public Long getOpportunityId() {
        return opportunityId;
    }

    public void setOpportunityId(Long opportunityId) {
        this.opportunityId = opportunityId;
    }

    public LocalDateTime getCheckDate() {
        return checkDate;
    }

    public void setCheckDate(LocalDateTime checkDate) {
        this.checkDate = checkDate;
    }

    public List<String> getApplicableRegulations() {
        return applicableRegulations;
    }

    public void setApplicableRegulations(List<String> applicableRegulations) {
        this.applicableRegulations = applicableRegulations;
    }

    public ThresholdAnalysis getThresholdAnalysis() {
        return thresholdAnalysis;
    }

    public void setThresholdAnalysis(ThresholdAnalysis thresholdAnalysis) {
        this.thresholdAnalysis = thresholdAnalysis;
    }

    public CPVValidation getCpvValidation() {
        return cpvValidation;
    }

    public void setCpvValidation(CPVValidation cpvValidation) {
        this.cpvValidation = cpvValidation;
    }

    public DocumentationRequirements getDocumentationRequirements() {
        return documentationRequirements;
    }

    public void setDocumentationRequirements(DocumentationRequirements documentationRequirements) {
        this.documentationRequirements = documentationRequirements;
    }

    public PA2023Compliance getPa2023Compliance() {
        return pa2023Compliance;
    }

    public void setPa2023Compliance(PA2023Compliance pa2023Compliance) {
        this.pa2023Compliance = pa2023Compliance;
    }

    public CladdingCompliance getCladdingCompliance() {
        return claddingCompliance;
    }

    public void setCladdingCompliance(CladdingCompliance claddingCompliance) {
        this.claddingCompliance = claddingCompliance;
    }

    public int getOverallScore() {
        return overallScore;
    }

    public void setOverallScore(int overallScore) {
        this.overallScore = overallScore;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public List<ComplianceRecommendation> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<ComplianceRecommendation> recommendations) {
        this.recommendations = recommendations;
    }

    /**
     * Analysis of procurement thresholds and procedures.
     */
    public static class ThresholdAnalysis {
        private BigDecimal contractValue;
        private String procurementType;
        private BigDecimal applicableThreshold;
        private boolean aboveThreshold;
        private List<String> requiredProcedures = new ArrayList<>();
        private List<String> publicationRequirements = new ArrayList<>();
        private Map<String, Integer> minimumTimescales;

        public BigDecimal getContractValue() {
            return contractValue;
        }

        public void setContractValue(BigDecimal contractValue) {
            this.contractValue = contractValue;
        }

        public String getProcurementType() {
            return procurementType;
        }

        public void setProcurementType(String procurementType) {
            this.procurementType = procurementType;
        }

        public BigDecimal getApplicableThreshold() {
            return applicableThreshold;
        }

        public void setApplicableThreshold(BigDecimal applicableThreshold) {
            this.applicableThreshold = applicableThreshold;
        }

        public boolean isAboveThreshold() {
            return aboveThreshold;
        }

        public void setAboveThreshold(boolean aboveThreshold) {
            this.aboveThreshold = aboveThreshold;
        }

        public List<String> getRequiredProcedures() {
            return requiredProcedures;
        }

        public void setRequiredProcedures(List<String> requiredProcedures) {
            this.requiredProcedures = requiredProcedures;
        }

        public List<String> getPublicationRequirements() {
            return publicationRequirements;
        }

        public void setPublicationRequirements(List<String> publicationRequirements) {
            this.publicationRequirements = publicationRequirements;
        }

        public Map<String, Integer> getMinimumTimescales() {
            return minimumTimescales;
        }

        public void setMinimumTimescales(Map<String, Integer> minimumTimescales) {
            this.minimumTimescales = minimumTimescales;
        }
    }

    /**
     * Validation outcome for CPV codes supplied by the opportunity.
     */
    public static class CPVValidation {
        private List<String> providedCodes;
        private List<CPVCodeValidation> codeValidations = new ArrayList<>();
        private List<String> claddingRelatedCodes = new ArrayList<>();
        private List<String> suggestedAdditionalCodes = new ArrayList<>();

        public List<String> getProvidedCodes() {
            return providedCodes;
        }

        public void setProvidedCodes(List<String> providedCodes) {
            this.providedCodes = providedCodes;
        }

        public List<CPVCodeValidation> getCodeValidations() {
            return codeValidations;
        }

        public void setCodeValidations(List<CPVCodeValidation> codeValidations) {
            this.codeValidations = codeValidations;
        }

        public List<String> getCladdingRelatedCodes() {
            return claddingRelatedCodes;
        }

        public void setCladdingRelatedCodes(List<String> claddingRelatedCodes) {
            this.claddingRelatedCodes = claddingRelatedCodes;
        }

        public List<String> getSuggestedAdditionalCodes() {
            return suggestedAdditionalCodes;
        }

        public void setSuggestedAdditionalCodes(List<String> suggestedAdditionalCodes) {
            this.suggestedAdditionalCodes = suggestedAdditionalCodes;
        }
    }

    /**
     * Documentation required to submit a compliant bid.
     */
    public static class DocumentationRequirements {
        private List<String> requiredDocuments = new ArrayList<>();
        private List<String> optionalDocuments = new ArrayList<>();

        public List<String> getRequiredDocuments() {
            return requiredDocuments;
        }

        public void setRequiredDocuments(List<String> requiredDocuments) {
            this.requiredDocuments = requiredDocuments;
        }

        public List<String> getOptionalDocuments() {
            return optionalDocuments;
        }

        public void setOptionalDocuments(List<String> optionalDocuments) {
            this.optionalDocuments = optionalDocuments;
        }
    }

    /**
     * Procurement Act 2023 compliance sections.
     */
    public static class PA2023Compliance {
        private TransparencyRequirements transparencyRequirements;
        private ValueForMoneyAssessment valueForMoneyAssessment;
        private SupplierDueDiligence supplierDueDiligence;
        private ContractManagement contractManagement;
        private SMEAccessRequirements smeAccessRequirements;

        public TransparencyRequirements getTransparencyRequirements() {
            return transparencyRequirements;
        }

        public void setTransparencyRequirements(TransparencyRequirements transparencyRequirements) {
            this.transparencyRequirements = transparencyRequirements;
        }

        public ValueForMoneyAssessment getValueForMoneyAssessment() {
            return valueForMoneyAssessment;
        }

        public void setValueForMoneyAssessment(ValueForMoneyAssessment valueForMoneyAssessment) {
            this.valueForMoneyAssessment = valueForMoneyAssessment;
        }

        public SupplierDueDiligence getSupplierDueDiligence() {
            return supplierDueDiligence;
        }

        public void setSupplierDueDiligence(SupplierDueDiligence supplierDueDiligence) {
            this.supplierDueDiligence = supplierDueDiligence;
        }

        public ContractManagement getContractManagement() {
            return contractManagement;
        }

        public void setContractManagement(ContractManagement contractManagement) {
            this.contractManagement = contractManagement;
        }

        public SMEAccessRequirements getSmeAccessRequirements() {
            return smeAccessRequirements;
        }

        public void setSmeAccessRequirements(SMEAccessRequirements smeAccessRequirements) {
            this.smeAccessRequirements = smeAccessRequirements;
        }

        public static class TransparencyRequirements {
            private boolean compliant = true;

            public boolean isCompliant() {
                return compliant;
            }

            public void setCompliant(boolean compliant) {
                this.compliant = compliant;
            }
        }

        public static class ValueForMoneyAssessment {
            private boolean compliant = true;

            public boolean isCompliant() {
                return compliant;
            }

            public void setCompliant(boolean compliant) {
                this.compliant = compliant;
            }
        }

        public static class SupplierDueDiligence {
            private boolean compliant = true;

            public boolean isCompliant() {
                return compliant;
            }

            public void setCompliant(boolean compliant) {
                this.compliant = compliant;
            }
        }

        public static class ContractManagement {
            private boolean compliant = true;

            public boolean isCompliant() {
                return compliant;
            }

            public void setCompliant(boolean compliant) {
                this.compliant = compliant;
            }
        }

        public static class SMEAccessRequirements {
            private boolean compliant = true;

            public boolean isCompliant() {
                return compliant;
            }

            public void setCompliant(boolean compliant) {
                this.compliant = compliant;
            }
        }
    }

    /**
     * Building Safety Act focussed compliance for cladding work.
     */
    public static class CladdingCompliance {
        private BuildingSafetyActCompliance buildingSafetyActCompliance;
        private FireSafetyRequirements fireSafetyRequirements;
        private MaterialCompliance materialCompliance;
        private BuildingControlRequirements buildingControlRequirements;
        private CompetencyRequirements competencyRequirements;

        public BuildingSafetyActCompliance getBuildingSafetyActCompliance() {
            return buildingSafetyActCompliance;
        }

        public void setBuildingSafetyActCompliance(BuildingSafetyActCompliance buildingSafetyActCompliance) {
            this.buildingSafetyActCompliance = buildingSafetyActCompliance;
        }

        public FireSafetyRequirements getFireSafetyRequirements() {
            return fireSafetyRequirements;
        }

        public void setFireSafetyRequirements(FireSafetyRequirements fireSafetyRequirements) {
            this.fireSafetyRequirements = fireSafetyRequirements;
        }

        public MaterialCompliance getMaterialCompliance() {
            return materialCompliance;
        }

        public void setMaterialCompliance(MaterialCompliance materialCompliance) {
            this.materialCompliance = materialCompliance;
        }

        public BuildingControlRequirements getBuildingControlRequirements() {
            return buildingControlRequirements;
        }

        public void setBuildingControlRequirements(BuildingControlRequirements buildingControlRequirements) {
            this.buildingControlRequirements = buildingControlRequirements;
        }

        public CompetencyRequirements getCompetencyRequirements() {
            return competencyRequirements;
        }

        public void setCompetencyRequirements(CompetencyRequirements competencyRequirements) {
            this.competencyRequirements = competencyRequirements;
        }

        public static class BuildingSafetyActCompliance {
            private boolean compliant = true;

            public boolean isCompliant() {
                return compliant;
            }

            public void setCompliant(boolean compliant) {
                this.compliant = compliant;
            }
        }

        public static class FireSafetyRequirements {
            private boolean compliant = true;

            public boolean isCompliant() {
                return compliant;
            }

            public void setCompliant(boolean compliant) {
                this.compliant = compliant;
            }
        }

        public static class MaterialCompliance {
            private boolean compliant = true;

            public boolean isCompliant() {
                return compliant;
            }

            public void setCompliant(boolean compliant) {
                this.compliant = compliant;
            }
        }

        public static class BuildingControlRequirements {
            private boolean compliant = true;

            public boolean isCompliant() {
                return compliant;
            }

            public void setCompliant(boolean compliant) {
                this.compliant = compliant;
            }
        }

        public static class CompetencyRequirements {
            private boolean compliant = true;

            public boolean isCompliant() {
                return compliant;
            }

            public void setCompliant(boolean compliant) {
                this.compliant = compliant;
            }
        }
    }

    /**
     * Recommendations generated for the contractor.
     */
    public static class ComplianceRecommendation {
        private String priority;
        private String title;
        private String description;
        private List<String> actionItems = new ArrayList<>();

        public ComplianceRecommendation() {
        }

        public ComplianceRecommendation(String priority, String title, String description, List<String> actionItems) {
            this.priority = priority;
            this.title = title;
            this.description = description;
            if (actionItems != null) {
                this.actionItems = actionItems;
            }
        }

        public String getPriority() {
            return priority;
        }

        public void setPriority(String priority) {
            this.priority = priority;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public List<String> getActionItems() {
            return actionItems;
        }

        public void setActionItems(List<String> actionItems) {
            this.actionItems = actionItems;
        }
    }
}
