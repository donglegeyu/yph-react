package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("menu_view")
public class MenuView {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private String name;
    
    private String filters;
    
    private String filterOrder;
    
    private String userId;
    
    private String pageType;
    
    private LocalDateTime createTime;
    
    private LocalDateTime updateTime;
}
