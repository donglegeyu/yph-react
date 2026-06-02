package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.NavMenu;
import com.material.server.entity.SysDomain;
import com.material.server.entity.SysDomainMenu;
import com.material.server.mapper.NavMenuMapper;
import com.material.server.mapper.SysDomainMapper;
import com.material.server.mapper.SysDomainMenuMapper;
import com.material.server.service.NavMenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NavMenuServiceImpl extends ServiceImpl<NavMenuMapper, NavMenu> implements NavMenuService {

    private final SysDomainMenuMapper sysDomainMenuMapper;
    private final SysDomainMapper sysDomainMapper;

    @Override
    public List<NavMenu> getTreeList() {
        List<NavMenu> all = list(new LambdaQueryWrapper<NavMenu>()
                .eq(NavMenu::getDeleted, 0)
                .orderByAsc(NavMenu::getSort)
                .orderByAsc(NavMenu::getId));

        Map<Long, List<NavMenu>> childrenMap = all.stream()
                .filter(m -> m.getParentId() != null && m.getParentId() > 0)
                .collect(Collectors.groupingBy(NavMenu::getParentId));

        // 先找根节点 (parentId = 0)
        List<NavMenu> roots = all.stream()
                .filter(m -> m.getParentId() == null || m.getParentId() == 0)
                .collect(Collectors.toList());

        // 递归构建树
        return buildTreeRecursive(roots, childrenMap);
    }

    @Override
    public List<NavMenu> getTreeListByDomainId(Long domainId) {
        // 获取域菜单关联
        LambdaQueryWrapper<SysDomainMenu> domainMenuQuery = new LambdaQueryWrapper<>();
        domainMenuQuery.eq(SysDomainMenu::getDomainId, domainId);
        List<SysDomainMenu> domainMenus = sysDomainMenuMapper.selectList(domainMenuQuery);

        // 提取菜单ID集合
        Set<Long> menuIds = domainMenus.stream()
                .map(SysDomainMenu::getMenuId)
                .collect(Collectors.toSet());

        if (menuIds.isEmpty()) {
            return new ArrayList<>();
        }

        // 获取所有域内配置的菜单
        List<NavMenu> allMenus = list(new LambdaQueryWrapper<NavMenu>()
                .in(NavMenu::getId, menuIds)
                .eq(NavMenu::getDeleted, 0)
                .orderByAsc(NavMenu::getSort)
                .orderByAsc(NavMenu::getId));

        // 构建菜单ID到菜单的映射
        Map<Long, NavMenu> menuMap = allMenus.stream()
                .collect(Collectors.toMap(NavMenu::getId, m -> m));

        // 递归获取所有需要的父级菜单ID
        Set<Long> requiredMenuIds = new HashSet<>(menuIds);
        Set<Long> toAdd = new HashSet<>(menuIds);
        
        while (!toAdd.isEmpty()) {
            // 查找当前层级菜单的父级ID
            Set<Long> parentIds = toAdd.stream()
                    .map(menuId -> menuMap.get(menuId))
                    .filter(Objects::nonNull)
                    .map(NavMenu::getParentId)
                    .filter(Objects::nonNull)
                    .filter(parentId -> !requiredMenuIds.contains(parentId))
                    .collect(Collectors.toSet());
            
            if (parentIds.isEmpty()) {
                break;
            }
            
            requiredMenuIds.addAll(parentIds);
            toAdd = parentIds;
        }

        // 获取所有需要的菜单（域内配置 + 父级菜单）
        List<NavMenu> finalMenus = list(new LambdaQueryWrapper<NavMenu>()
                .in(NavMenu::getId, requiredMenuIds)
                .eq(NavMenu::getDeleted, 0)
                .orderByAsc(NavMenu::getSort)
                .orderByAsc(NavMenu::getId));

        // 构建子菜单映射
        Map<Long, List<NavMenu>> childrenMap = finalMenus.stream()
                .filter(m -> m.getParentId() != null && m.getParentId() > 0)
                .collect(Collectors.groupingBy(NavMenu::getParentId));

        // 找根节点（parent为null或0，且在requiredMenuIds中）
        List<NavMenu> roots = finalMenus.stream()
                .filter(m -> (m.getParentId() == null || m.getParentId() == 0) 
                        && requiredMenuIds.contains(m.getId()))
                .collect(Collectors.toList());

        return buildTreeRecursive(roots, childrenMap);
    }

    private List<NavMenu> buildTreeRecursive(List<NavMenu> nodes, Map<Long, List<NavMenu>> childrenMap) {
        List<NavMenu> result = new ArrayList<>();
        for (NavMenu node : nodes) {
            List<NavMenu> children = childrenMap.getOrDefault(node.getId(), new ArrayList<>());
            if (!children.isEmpty()) {
                node.setChildren(buildTreeRecursive(children, childrenMap));
            }
            result.add(node);
        }
        return result;
    }

    @Override
    public List<NavMenu> getTreeListByParentId(Long parentId) {
        return list(new LambdaQueryWrapper<NavMenu>()
                .eq(NavMenu::getParentId, parentId)
                .orderByAsc(NavMenu::getSort));
    }

    @Override
    public void batchUpdateStatus(List<Long> ids, Integer status) {
        for (Long id : ids) {
            NavMenu menu = new NavMenu();
            menu.setId(id);
            menu.setStatus(status);
            updateById(menu);
        }
    }

    @Override
    public void batchDelete(List<Long> ids) {
        sysDomainMenuMapper.delete(new LambdaQueryWrapper<SysDomainMenu>()
                .in(SysDomainMenu::getMenuId, ids));
        removeBatchByIds(ids);
    }

    @Override
    public int calculateLevel(Long parentId) {
        if (parentId == null || parentId == 0) {
            return 0;
        }
        NavMenu parent = getById(parentId);
        if (parent == null) {
            return 0;
        }
        return (parent.getLevel() != null ? parent.getLevel() : 0) + 1;
    }

    @Override
    public boolean save(NavMenu entity) {
        boolean result = super.save(entity);
        if (result && entity.getId() != null) {
            syncMenuToDefaultDomain(entity);
        }
        return result;
    }

    @Override
    public boolean removeById(java.io.Serializable id) {
        boolean result = super.removeById(id);
        if (result) {
            sysDomainMenuMapper.delete(new LambdaQueryWrapper<SysDomainMenu>()
                    .eq(SysDomainMenu::getMenuId, id));
        }
        return result;
    }

    private void syncMenuToDefaultDomain(NavMenu menu) {
        LambdaQueryWrapper<SysDomain> domainQuery = new LambdaQueryWrapper<>();
        domainQuery.eq(SysDomain::getStatus, 1)
                   .eq(SysDomain::getIsDefault, 1);
        List<SysDomain> defaultDomains = sysDomainMapper.selectList(domainQuery);

        for (SysDomain domain : defaultDomains) {
            LambdaQueryWrapper<SysDomainMenu> checkQuery = new LambdaQueryWrapper<>();
            checkQuery.eq(SysDomainMenu::getDomainId, domain.getId())
                      .eq(SysDomainMenu::getMenuId, menu.getId());
            if (sysDomainMenuMapper.selectCount(checkQuery) == 0) {
                SysDomainMenu domainMenu = new SysDomainMenu();
                domainMenu.setDomainId(domain.getId());
                domainMenu.setMenuId(menu.getId());
                domainMenu.setCustomLabel(menu.getLabel());
                domainMenu.setSort(menu.getSort());
                sysDomainMenuMapper.insert(domainMenu);
            }
        }
    }
}
