package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("construction_application")
public class ConstructionApplication {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String applicationNo;

    private String constructionName;

    private String content;

    private String status;

    private BigDecimal quantity;

    private BigDecimal budget;

    private String applicant;

    private LocalDateTime applyTime;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
