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

    private String residentialAddress;  // 常住地址（拼接展示用）

    private String residentialAreaCode; // 常住地址省市区编码（逗号分隔，编辑回填用）

    private String residentialStreet;   // 常住地址街道/乡镇

    private String residentialDetail;   // 常住地址详细地址

    private String idCardValidDate;     // 身份证有效期（逗号分隔，结束为2099-12-31表示长期）

    private String serviceArea;         // 接单区域

    private String idCardImages;        // 身份证图片（正反面，逗号分隔）

    private String workCertificate;     // 工作证明（图片URL，逗号分隔）

    private String serviceRecord;       // 服务记录（图片URL，逗号分隔）

    private String noCriminalCertificate;  // 无犯罪证明（图片URL，逗号分隔）

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
