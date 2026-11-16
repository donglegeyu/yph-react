package com.material.server.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * 管理端发送站内信请求
 */
@Data
public class NotifySendDTO {

    /** 模板编码 */
    private String templateCode;

    /** 收件人 sys_user.id 列表 */
    private List<Long> userIds;

    /** 占位符参数，可含 title 覆盖默认标题 */
    private Map<String, Object> params;

    /** 发送来源域（仅记录，可为空） */
    private Long domainId;
}
