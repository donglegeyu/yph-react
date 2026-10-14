package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.material.server.common.Result;
import com.material.server.entity.PageDefinition;
import com.material.server.entity.PageMigrationScript;
import com.material.server.mapper.PageDefinitionMapper;
import com.material.server.mapper.PageMigrationScriptMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 页面生成器迁移脚本存档列表（只读）
 * 脚本由发布流程生成存档，此处仅提供查询/复制/下载的数据源
 */
@RestController
@RequestMapping("/api/page-migration-scripts")
@RequiredArgsConstructor
public class PageMigrationScriptController {

    private final PageMigrationScriptMapper scriptMapper;
    private final PageDefinitionMapper pageDefinitionMapper;

    /**
     * 脚本列表（最近 200 条，版本号倒序），联查页面当前迁移状态
     */
    @GetMapping
    public Result<List<PageMigrationScript>> list() {
        LambdaQueryWrapper<PageMigrationScript> query = new LambdaQueryWrapper<>();
        query.orderByDesc(PageMigrationScript::getVersion)
                .orderByDesc(PageMigrationScript::getId)
                .last("LIMIT 200");
        List<PageMigrationScript> scripts = scriptMapper.selectList(query);

        // 联查页面定义，填充当前迁移状态（页面可能在上次脚本生成后又做了变更）
        if (!scripts.isEmpty()) {
            Set<Long> defIds = scripts.stream()
                    .map(PageMigrationScript::getPageDefinitionId)
                    .collect(Collectors.toSet());
            LambdaQueryWrapper<PageDefinition> defQuery = new LambdaQueryWrapper<>();
            defQuery.in(PageDefinition::getId, defIds);
            Map<Long, String> statusMap = pageDefinitionMapper.selectList(defQuery).stream()
                    .collect(Collectors.toMap(PageDefinition::getId,
                            d -> d.getMigrationStatus() != null ? d.getMigrationStatus() : "not_generated",
                            (a, b) -> a));
            scripts.forEach(s -> s.setMigrationStatus(statusMap.get(s.getPageDefinitionId())));
        }

        return Result.success(scripts);
    }
}
