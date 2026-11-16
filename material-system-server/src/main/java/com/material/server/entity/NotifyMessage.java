package com.material.server.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 站内信
 */
@Data
@TableName("notify_message")
public class NotifyMessage {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 收件人 sys_user.id */
    private Long userId;

    /** 发送来源域（仅记录） */
    private Long domainId;

    /** 来源模板 id */
    private Long templateId;

    /** 来源模板编码 */
    private String templateCode;

    /** 标题（渲染后快照） */
    private String title;

    /** 内容（渲染后快照，模板改动不影响历史消息） */
    private String content;

    /** 类型：1系统通知 2审批通知（预留） */
    private Integer type;

    /** 已读状态：0未读 1已读 */
    private Integer readStatus;

    /** 已读时间 */
    private LocalDateTime readTime;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
