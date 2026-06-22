package com.material.server.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * 工匠创建 DTO
 * 对齐前端 CraftsmanForm 的提交 payload
 */
@Data
public class CraftsmanCreateDTO {

    private String name;
    private String phone;
    private String userAccount;
    private String email;
    private String craftsmanCategory;
    private Integer craftsmanType;
    private String serviceProviderName;
    private String region;
    private String idCardNo;
    private String idCardValidDate;

    private List<Object> residentialArea;
    private List<String> residentialAreaLabels;
    private String residentialStreet;
    private String residentialDetail;

    private String idCardFrontUrl;
    private String idCardBackUrl;

    private List<String> serviceAreas;
    private List<String> serviceAreaLabels;

    private List<Long> serviceSkillIds;
    private List<String> brands;

    private Map<String, String> certificates;

    private Integer workProofType;
    private List<String> workCertificate;
    private List<String> serviceRecord;
    private List<String> noCriminalCertificate;
}
