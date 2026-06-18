package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("certificate_image")
public class CertificateImage {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String certificateType;

    private String exampleImage;

    private Integer sortOrder;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
