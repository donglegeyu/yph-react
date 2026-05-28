package com.material.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.material.server.common.Result;
import com.material.server.entity.SysDomainMenu;
import com.material.server.mapper.SysDomainMenuMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sys/domain-menus")
@RequiredArgsConstructor
public class SysDomainMenuController {

    private final SysDomainMenuMapper sysDomainMenuMapper;

    @GetMapping
    public Result<List<SysDomainMenu>> getByDomainId(@RequestParam Long domainId) {
        LambdaQueryWrapper<SysDomainMenu> query = new LambdaQueryWrapper<>();
        query.eq(SysDomainMenu::getDomainId, domainId);
        query.orderByAsc(SysDomainMenu::getSort);
        List<SysDomainMenu> list = sysDomainMenuMapper.selectList(query);
        return Result.success(list);
    }

    @PostMapping("/batch")
    public Result<Void> saveBatch(@RequestBody List<SysDomainMenu> menus) {
        if (menus == null || menus.isEmpty()) {
            return Result.success();
        }
        Long domainId = menus.get(0).getDomainId();
        LambdaQueryWrapper<SysDomainMenu> query = new LambdaQueryWrapper<>();
        query.eq(SysDomainMenu::getDomainId, domainId);
        sysDomainMenuMapper.delete(query);

        for (SysDomainMenu menu : menus) {
            menu.setId(null);
            sysDomainMenuMapper.insert(menu);
        }
        return Result.success();
    }
}
