package com.material.server.service;

import com.material.server.dto.PageDefinitionDTO;
import com.material.server.dto.PublishResultDTO;
import com.material.server.dto.ReadyCheckDTO;
import com.material.server.entity.PageDefinition;

/**
 * 建表迁移脚本服务
 *
 * 项目红线：本服务只「生成」Flyway 增量脚本文本并存档，
 * 绝不在运行时执行任何建表/改表 DDL。脚本由研发评审放入
 * db/migration/ 目录后，由 Flyway 在后端启动时执行。
 */
public interface MigrationScriptService {

    /**
     * 发布时联动生成迁移脚本：
     * - 绑定已有表（isNewTable=false）：强校验配置列在表中真实存在，缺失则报错
     * - 新表且表不存在：生成 CREATE TABLE 幂等脚本
     * - 新表且表已存在（本系统此前生成）：对比 information_schema 找出缺失列，生成 ALTER ADD COLUMN 幂等脚本
     * - 新表且表已存在（非本系统创建）：报错，提示改用绑定模式或换表名
     *
     * @return 脚本信息（含内容）；无需脚本时 scriptType/content 为 null，migrationStatus 表示表就绪状态
     */
    PublishResultDTO generateForPublish(PageDefinition entity, PageDefinitionDTO dto, String operator);

    /**
     * 就绪检查：校验目标表与全部配置列是否真实存在（information_schema），
     * 并把结果写入 page_definition.migration_status
     */
    ReadyCheckDTO checkReady(PageDefinition entity, PageDefinitionDTO dto);
}
