package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@TableName("sys_dept")
public class SysDept {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long parentId;

    private String ancestors;

    private String deptName;

    private String deptCode;

    private Integer sortOrder;

    private Long leaderUserId;

    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;

    @TableField(exist = false)
    private List<SysDept> children;

    @TableField(exist = false)
    private Long userCount;
}
