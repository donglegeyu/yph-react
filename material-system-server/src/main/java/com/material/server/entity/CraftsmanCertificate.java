package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("craftsman_certificate")
public class CraftsmanCertificate {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long craftsmanId;

    private String certificateType;

    private String imageUrls;

    private LocalDateTime createTime;

    @TableLogic
    private Integer deleted;
}
