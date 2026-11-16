package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("craftsman_application")
public class CraftsmanApplication {

    @TableId(type = IdType.AUTO)
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

    private String formData;

    private String rejectReason;

    /** 审批实例 ID（ appr_business_link.process_instance_id），撤回联动与回调对账用 */
    private String approvalInstanceId;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
