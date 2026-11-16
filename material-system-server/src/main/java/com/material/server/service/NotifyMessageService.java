package com.material.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.material.server.entity.NotifyMessage;

import java.util.List;
import java.util.Map;

public interface NotifyMessageService extends IService<NotifyMessage> {

    /**
     * 按模板发送站内信（占位符渲染后以快照落库）。
     *
     * @param templateCode 模板编码（必须存在且启用）
     * @param userIds      收件人 sys_user.id 列表（去重后逐人生成一条消息）
     * @param params       占位符参数，可含 title 覆盖默认标题（模板名称）
     * @param domainId     发送来源域（仅记录，可为空）
     * @return 发送条数
     */
    int sendByTemplate(String templateCode, List<Long> userIds, Map<String, Object> params, Long domainId);
}
