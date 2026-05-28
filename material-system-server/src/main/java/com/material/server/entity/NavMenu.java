package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@TableName("nav_menu")
public class NavMenu {

    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("`key`")
    private String key;

    private String label;

    private String path;

    private String icon;

    private Integer sort;

    private Integer status;

    private Long parentId;

    private Integer level;

    private String menuType;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;

    @TableField(exist = false)
    private List<NavMenu> children;
}
