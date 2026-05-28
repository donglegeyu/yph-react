package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_user_domain")
public class SysUserDomain {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long domainId;

    private LocalDateTime createTime;
}
