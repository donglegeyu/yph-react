package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_data_permission")
public class SysDataPermission {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long domainId;

    private String menuKey;

    private String filterType;

    private String filterField;

    private String filterValue;

    private LocalDateTime createTime;
}
