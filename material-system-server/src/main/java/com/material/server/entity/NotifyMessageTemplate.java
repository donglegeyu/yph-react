package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 站内信消息模板
 */
@Data
@TableName("notify_message_template")
public class NotifyMessageTemplate {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 模板编码（业务唯一，应用层保证） */
    private String code;

    /** 模板名称 */
    private String name;

    /** 类型：1系统通知 2审批通知（预留） */
    private Integer type;

    /** 模板内容，支持 {paramName} 占位符 */
    private String content;

    /** 状态：0停用 1启用 */
    private Integer status;

    private String remark;

    private String createBy;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
