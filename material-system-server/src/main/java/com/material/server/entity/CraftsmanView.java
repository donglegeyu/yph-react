package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("craftsman_view")
public class CraftsmanView {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    private String filters;

    private String filterOrder;

    private String userId;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
