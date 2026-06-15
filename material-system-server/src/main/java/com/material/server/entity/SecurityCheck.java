package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("security_check")
public class SecurityCheck {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String orderCode;

    private String gasCode;

    private String customerName;

    private String phone;

    private String reportBook;

    private String userType;

    private String uploadStatus;

    private String checkStatus;

    private String visitResult;

    private String checkUser;

    private String hasDanger;

    private String maxDangerLevel;

    private Integer dangerCount;

    private String address;

    private String company;

    private String checkArea;

    private String checkCategory;

    private LocalDateTime checkDate;

    private String checkResult;

    private String hiddenDanger;

    private String status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
