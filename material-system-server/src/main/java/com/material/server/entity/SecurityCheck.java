package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("security_check")
public class SecurityCheck {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String gasCode;

    private String address;

    private String checkUser;

    private LocalDateTime checkDate;

    private String checkResult;

    private String hiddenDanger;

    private String status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
