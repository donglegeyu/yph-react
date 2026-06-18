package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("craftsman")
public class Craftsman {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String craftsmanCode;

    private String name;

    private String phone;

    private String userAccount;

    private String serviceProviderName;

    private String craftsmanCategory;  // 工匠类别: outsource外部员工, internal内部员工

    private Integer craftsmanType;     // 工匠类型: 1正式工匠, 2意向工匠

    private String region;

    private String serviceSkills;

    private LocalDateTime registerTime;

    private Integer status;             // 状态: 1启用, 0停用

    private String birthday;            // 出生日期

    private String idCardNo;            // 身份证号

    private Integer age;                // 年龄

    private String residentialAddress;  // 常住地址

    private String serviceArea;         // 接单区域

    private String idCardImages;        // 身份证图片（正反面，逗号分隔）

    private String workCertificate;     // 工作证明（图片URL，逗号分隔）

    private String noCriminalCertificate;  // 无犯罪证明（图片URL，逗号分隔）

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
