package com.material.server.vo;

import lombok.Data;
import java.util.List;

/**
 * 工匠编辑详情 VO
 * 返回主表字段 + 4 张关联表数据，用于前端编辑表单回填
 */
@Data
public class CraftsmanEditVO {

    private Long id;
    private String craftsmanCode;
    private String name;
    private String phone;
    private String userAccount;
    private String serviceProviderName;
    private String craftsmanCategory;
    private Integer craftsmanType;
    private String region;

    private String idCardNo;
    private String idCardValidDate;
    private String idCardFrontUrl;
    private String idCardBackUrl;

    private String residentialAreaCode;
    private List<String> residentialAreaCodeList;
    private List<String> residentialAreaLabels;
    private String residentialStreet;
    private String residentialDetail;

    private List<String> serviceAreaCodes;
    private List<String> serviceAreaLabels;

    private List<Long> serviceSkillIds;
    private List<String> brands;

    private java.util.Map<String, List<String>> certificates;

    private Integer workProofType;
    private List<String> workCertificate;
    private List<String> serviceRecord;
    private List<String> noCriminalCertificate;
}
