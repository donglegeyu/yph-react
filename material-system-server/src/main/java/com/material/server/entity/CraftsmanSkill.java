package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("craftsman_skill")
public class CraftsmanSkill {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long craftsmanId;

    private Long skillId;

    private LocalDateTime createTime;

    @TableLogic
    private Integer deleted;
}
