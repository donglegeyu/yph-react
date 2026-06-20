package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("craftsman_brand")
public class CraftsmanBrand {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long craftsmanId;

    private String brandValue;

    private LocalDateTime createTime;

    @TableLogic
    private Integer deleted;
}
