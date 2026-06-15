package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("sys_role_dept")
public class SysRoleDept {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long roleId;

    private Long deptId;

    private LocalDateTime createTime;
}
