package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("craftsman_service_area")
public class CraftsmanServiceArea {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long craftsmanId;

    private String areaCodes;

    private String areaLabels;

    private LocalDateTime createTime;

    @TableLogic
    private Integer deleted;
}
