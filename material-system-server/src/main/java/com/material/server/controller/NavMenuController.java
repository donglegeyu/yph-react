package com.material.server.controller;

import com.material.server.common.Result;
import com.material.server.entity.NavMenu;
import com.material.server.service.NavMenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/nav-menus")
@RequiredArgsConstructor
public class NavMenuController {

    private final NavMenuService navMenuService;

    @GetMapping
    public Result<List<NavMenu>> list(@RequestParam(required = false) Long domainId,
                                      @RequestParam(required = false) Long userId) {
        List<NavMenu> menus;
        if (userId != null) {
            menus = navMenuService.getTreeListByDomainIdAndUserId(domainId, userId);
        } else if (domainId != null) {
            menus = navMenuService.getTreeListByDomainId(domainId);
        } else {
            menus = navMenuService.getTreeList();
        }
        return Result.success(menus);
    }

    @GetMapping("/{id}")
    public Result<NavMenu> detail(@PathVariable Long id) {
        NavMenu menu = navMenuService.getById(id);
        return Result.success(menu);
    }

    @PostMapping
    public Result<Long> create(@RequestBody NavMenu menu) {
        int level = navMenuService.calculateLevel(menu.getParentId());
        menu.setLevel(level);
        navMenuService.save(menu);
        return Result.success(menu.getId());
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody NavMenu menu) {
        menu.setId(id);
        int level = navMenuService.calculateLevel(menu.getParentId());
        menu.setLevel(level);
        navMenuService.updateById(menu);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        navMenuService.removeById(id);
        return Result.success();
    }

    @PutMapping("/batch-status")
    public Result<Void> batchUpdateStatus(@RequestBody BatchStatusRequest request) {
        navMenuService.batchUpdateStatus(request.getIds(), request.getStatus());
        return Result.success();
    }

    @RequestMapping("/batch")
    public Result<Void> batchDelete(@RequestBody BatchDeleteRequest request) {
        navMenuService.batchDelete(request.getIds());
        return Result.success();
    }

    public static class BatchStatusRequest {
        private List<Long> ids;
        private Integer status;

        public List<Long> getIds() {
            return ids;
        }

        public void setIds(List<Long> ids) {
            this.ids = ids;
        }

        public Integer getStatus() {
            return status;
        }

        public void setStatus(Integer status) {
            this.status = status;
        }
    }

    public static class BatchDeleteRequest {
        private List<Long> ids;

        public List<Long> getIds() {
            return ids;
        }

        public void setIds(List<Long> ids) {
            this.ids = ids;
        }
    }
}
