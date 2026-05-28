package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_domain_menu")
public class SysDomainMenu {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long domainId;

    private Long menuId;

    private String customLabel;

    private Integer customLevel;

    private Long customParentId;

    private Integer sort;

    private LocalDateTime createTime;
}
