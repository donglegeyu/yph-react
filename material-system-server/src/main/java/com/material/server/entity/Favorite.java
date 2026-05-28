package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("favorite")
public class Favorite {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 用户ID，固定为 1（单用户场景） */
    private Long userId;

    /** 收藏的菜单 key */
    private String menuKey;

    /** 收藏的菜单名称 */
    private String menuLabel;

    /** 收藏的菜单路径 */
    private String menuPath;

    /** 排序 */
    private Integer sort;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
