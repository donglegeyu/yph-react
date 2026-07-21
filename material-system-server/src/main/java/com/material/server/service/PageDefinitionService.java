package com.material.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.material.server.dto.PageDefinitionDTO;
import com.material.server.entity.PageDefinition;

public interface PageDefinitionService extends IService<PageDefinition> {

    /**
     * 保存草稿（创建或更新）
     */
    Long saveSchema(PageDefinitionDTO dto, String operator);

    /**
     * 发布：更新状态为 published，并联动 nav_menu
     *
     * @param id       页面定义 ID
     * @param domainId 发布到的目标域 ID（菜单仅同步到该域）
     */
    void publish(Long id, Long domainId);

    /**
     * 获取完整 schema（反序列化 JSON）
     */
    PageDefinitionDTO getSchema(Long id);
}
