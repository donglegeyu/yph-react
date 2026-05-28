package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("material_application")
public class MaterialApplication {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String applicationNo;

    private String materialName;

    private String spec;

    private String unit;

    private BigDecimal quantity;

    @TableField("material_quantity")
    private BigDecimal materialQuantity;

    private String department;

    private String supplier;

    private String description;

    private String status;

    private String applicant;

    private LocalDateTime applyTime;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
