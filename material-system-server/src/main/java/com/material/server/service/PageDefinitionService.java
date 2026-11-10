package com.material.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.material.server.dto.PageDefinitionDTO;
import com.material.server.dto.PublishResultDTO;
import com.material.server.dto.ReadyCheckDTO;
import com.material.server.entity.PageDefinition;

public interface PageDefinitionService extends IService<PageDefinition> {

    /**
     * 保存草稿（创建或更新）
     */
    Long saveSchema(PageDefinitionDTO dto, String operator);

    /**
     * 发布：生成建表迁移脚本（只生成不执行）→ 更新状态为 published → 联动 nav_menu
     *
     * @param id       页面定义 ID
     * @param domainId 发布到的目标域 ID（菜单仅同步到该域）
     * @param operator 操作人（用于记录 updated_by）
     * @return 发布结果（含迁移脚本信息；无脚本时 migrationStatus 表示表就绪状态）
     */
    PublishResultDTO publish(Long id, Long domainId, String operator);

    /**
     * 就绪检查：校验目标数据表与配置列是否真实存在（information_schema），
     * 并把结果写入 page_definition.migration_status
     */
    ReadyCheckDTO checkMigrationReady(Long id);

    /**
     * 取消发布：状态改回 draft，并反向清理菜单联动
     * （new_child 级联删除子菜单；bind_existing 还原菜单 path）
     *
     * @param id       页面定义 ID
     * @param operator 操作人（用于记录 updated_by）
     */
    void unpublish(Long id, String operator);

    /**
     * 获取完整 schema（反序列化 JSON）
     */
    PageDefinitionDTO getSchema(Long id);
}
