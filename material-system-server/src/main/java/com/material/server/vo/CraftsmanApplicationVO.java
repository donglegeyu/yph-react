package com.material.server.vo;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 工匠申请列表/详情 VO
 */
@Data
public class CraftsmanApplicationVO {

    private Long id;
    private String applicationNo;
    private String applicationType;
    private String status;
    private String name;
    private String phone;
    private String userAccount;
    private String serviceProviderName;
    private String applicant;
    private LocalDate applyTime;
    private String rejectReason;
    private String formData;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
