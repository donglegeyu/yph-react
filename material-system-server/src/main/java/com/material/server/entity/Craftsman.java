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

    private String type;  // outsource: 外包工匠, external: 外部工匠

    private String region;

    private String serviceSkills;

    private LocalDateTime registerTime;

    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
