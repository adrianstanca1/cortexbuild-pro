package com.asagents.procurement.compliance;

import java.util.*;

import com.asagents.procurement.compliance.model.CPVCodeValidation;
import org.springframework.stereotype.Service;

/**
 * CPV (Common Procurement Vocabulary) Code Service
 * Validates and provides information about CPV codes for construction
 * procurement
 */
@Service
public class CPVCodeService {

    // Construction and cladding-related CPV codes with descriptions
    private static final Map<String, String> CPV_CODES = createCPVCodesMap();

    private static Map<String, String> createCPVCodesMap() {
        Map<String, String> codes = new HashMap<>();
        codes.put("45000000", "Construction work");
        codes.put("45100000", "Site preparation");
        codes.put("45200000", "Works for complete or part construction and civil engineering work");
        codes.put("45261000", "Roof work and other special trade construction work");
        codes.put("45261100", "Roof covering work");
        codes.put("45261200", "Roof framework work");
        codes.put("45261210", "Cladding work");
        codes.put("45261220", "Weatherproofing work");
        codes.put("45300000", "Building installation work");
        codes.put("45400000", "Building completion work");
        codes.put("45410000", "Plastering work");
        codes.put("45420000", "Joinery installation");
        codes.put("45421000", "Carpentry and joinery installation work");
        codes.put("45421100", "Installation of cladding");
        codes.put("45421130", "Installation of external cladding");
        codes.put("45421140", "Installation of internal cladding");
        codes.put("45430000", "Floor and wall covering work");
        codes.put("45440000", "Painting and glazing work");
        codes.put("45450000", "Other building completion work");
        codes.put("45453000", "Other building completion work");
        codes.put("44000000", "Construction materials and associated items");
        codes.put("44100000", "Construction materials");
        codes.put("44110000", "Structural materials");
        codes.put("44111000", "Structural metal products");
        codes.put("44111300", "Exterior wall cladding");
        codes.put("44111400", "Curtain walling");
        codes.put("44130000", "Non-structural building materials");
        codes.put("44132000", "Insulation materials");
        codes.put("44163000", "Cladding panels");
        return Collections.unmodifiableMap(codes);
    }

    // Categories for CPV codes
    private static final Map<String, String> CPV_CATEGORIES = createCPVCategoriesMap();

    private static Map<String, String> createCPVCategoriesMap() {
        Map<String, String> categories = new HashMap<>();
        categories.put("45000000", "CONSTRUCTION_WORKS");
        categories.put("45100000", "SITE_PREPARATION");
        categories.put("45200000", "CIVIL_ENGINEERING");
        categories.put("45261000", "SPECIALIST_CONSTRUCTION");
        categories.put("45261210", "CLADDING_SPECIALIST");
        categories.put("45300000", "BUILDING_INSTALLATION");
        categories.put("45400000", "BUILDING_COMPLETION");
        categories.put("44000000", "CONSTRUCTION_MATERIALS");
        categories.put("44110000", "STRUCTURAL_MATERIALS");
        categories.put("44111300", "CLADDING_MATERIALS");
        return Collections.unmodifiableMap(categories);
    }

    /**
     * Validate a single CPV code
     */
    public CPVCodeValidation validateCode(String code) {
        // System.out.println("Validating CPV code: " + code);

        CPVCodeValidation validation = new CPVCodeValidation();
        validation.setCode(code);

        // Check if code exists in our database
        if (CPV_CODES.containsKey(code)) {
            validation.setValid(true);
            validation.setDescription(CPV_CODES.get(code));
            validation.setCategory(CPV_CATEGORIES.getOrDefault(code, "GENERAL"));
            validation.setIssues(new ArrayList<>());
        } else {
            validation.setValid(false);
            validation.setDescription("Unknown CPV code");
            validation.setCategory("UNKNOWN");

            List<String> issues = new ArrayList<>();

            // Check code format
            if (!isValidCPVFormat(code)) {
                issues.add("Invalid CPV code format. Should be 8 digits.");
            }

            // Suggest similar codes
            List<String> suggestions = findSimilarCodes(code);
            if (!suggestions.isEmpty()) {
                issues.add("Similar codes found: " + String.join(", ", suggestions));
            } else {
                issues.add("No similar codes found. Please verify the CPV code.");
            }

            validation.setIssues(issues);
        }

        return validation;
    }

    /**
     * Get all CPV codes related to cladding work
     */
    public List<String> getCladdingRelatedCodes() {
        return Arrays.asList(
                "45261210", // Cladding work
                "45421100", // Installation of cladding
                "45421130", // Installation of external cladding
                "45421140", // Installation of internal cladding
                "44111300", // Exterior wall cladding
                "44111400", // Curtain walling
                "44163000" // Cladding panels
        );
    }

    /**
     * Get CPV codes for general construction work
     */
    public List<String> getConstructionCodes() {
        return Arrays.asList(
                "45000000", // Construction work
                "45200000", // Works for complete or part construction
                "45261000", // Roof work and other special trade construction
                "45300000", // Building installation work
                "45400000" // Building completion work
        );
    }

    /**
     * Search CPV codes by description
     */
    public List<String> searchByDescription(String searchTerm) {
        String searchLower = searchTerm.toLowerCase();
        List<String> results = new ArrayList<>();

        for (Map.Entry<String, String> entry : CPV_CODES.entrySet()) {
            if (entry.getValue().toLowerCase().contains(searchLower)) {
                results.add(entry.getKey());
            }
        }

        return results;
    }

    /**
     * Get description for a CPV code
     */
    public String getCodeDescription(String code) {
        return CPV_CODES.getOrDefault(code, "Unknown CPV code");
    }

    /**
     * Get category for a CPV code
     */
    public String getCodeCategory(String code) {
        return CPV_CATEGORIES.getOrDefault(code, "GENERAL");
    }

    /**
     * Validate CPV code format (8 digits)
     */
    private boolean isValidCPVFormat(String code) {
        return code != null && code.matches("\\d{8}");
    }

    /**
     * Find similar CPV codes based on prefix matching
     */
    private List<String> findSimilarCodes(String code) {
        List<String> similar = new ArrayList<>();

        if (code == null || code.length() < 2) {
            return similar;
        }

        // Find codes with same first 2-4 digits
        String prefix2 = code.substring(0, Math.min(2, code.length()));
        String prefix4 = code.length() >= 4 ? code.substring(0, 4) : prefix2;

        for (String existingCode : CPV_CODES.keySet()) {
            if (existingCode.startsWith(prefix4) || existingCode.startsWith(prefix2)) {
                similar.add(existingCode);
            }
        }

        return similar.subList(0, Math.min(5, similar.size())); // Return max 5 suggestions
    }

    /**
     * Get all available CPV codes
     */
    public Map<String, String> getAllCodes() {
        return new HashMap<>(CPV_CODES);
    }

    /**
     * Check if a code is cladding-related
     */
    public boolean isCladdingRelated(String code) {
        return getCladdingRelatedCodes().contains(code) ||
                CPV_CODES.getOrDefault(code, "").toLowerCase().contains("cladding");
    }

    /**
     * Get recommended CPV codes for a procurement type
     */
    public List<String> getRecommendedCodes(String procurementType) {
        switch (procurementType.toUpperCase()) {
            case "CLADDING":
                return getCladdingRelatedCodes();
            case "CONSTRUCTION":
                return getConstructionCodes();
            case "ROOFING":
                return Arrays.asList("45261000", "45261100", "45261200");
            case "INSTALLATION":
                return Arrays.asList("45300000", "45420000", "45421000");
            default:
                return getConstructionCodes();
        }
    }
}
