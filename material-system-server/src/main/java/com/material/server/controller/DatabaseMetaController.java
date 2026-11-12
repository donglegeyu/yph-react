package com.material.server.controller;

import com.material.server.common.Result;
import com.material.server.dto.DbMetaRelationDTO;
import com.material.server.dto.DbMetaSummaryDTO;
import com.material.server.dto.DbMetaTableDTO;
import com.material.server.dto.DbMetaTableDetailDTO;
import com.material.server.service.DatabaseMetaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 后端数据管理：只读展示数据库表结构、字段与表间关系
 */
@RestController
@RequestMapping("/api/sys/db-meta")
@RequiredArgsConstructor
public class DatabaseMetaController {

    private final DatabaseMetaService databaseMetaService;

    @GetMapping("/summary")
    public Result<DbMetaSummaryDTO> summary() {
        return Result.success(databaseMetaService.getSummary());
    }

    @GetMapping("/tables")
    public Result<List<DbMetaTableDTO>> tables(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "false") boolean includeHidden) {
        return Result.success(databaseMetaService.listTables(keyword, includeHidden));
    }

    @GetMapping("/tables/{table}")
    public Result<DbMetaTableDetailDTO> tableDetail(@PathVariable String table) {
        return Result.success(databaseMetaService.getTableDetail(table));
    }

    @GetMapping("/relations")
    public Result<List<DbMetaRelationDTO>> relations(
            @RequestParam(defaultValue = "all") String scope) {
        return Result.success(databaseMetaService.listRelations(scope));
    }

    @PostMapping("/refresh")
    public Result<Void> refresh() {
        databaseMetaService.refreshCache();
        return Result.success();
    }
}
