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
import java.util.LinkedHashMap;
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
        LambdaQueryWrapper<SysDomainMenu> domainMenuQuery = new LambdaQueryWrapper<>();
        domainMenuQuery.eq(SysDomainMenu::getDomainId, domainId);
        List<SysDomainMenu> domainMenus = sysDomainMenuMapper.selectList(domainMenuQuery);

        if (domainMenus.isEmpty()) {
            return new ArrayList<>();
        }

        Set<Long> menuIds = domainMenus.stream()
                .map(SysDomainMenu::getMenuId)
                .collect(Collectors.toSet());

        List<NavMenu> allMenus = list(new LambdaQueryWrapper<NavMenu>()
                .in(NavMenu::getId, menuIds)
                .eq(NavMenu::getDeleted, 0)
                .orderByAsc(NavMenu::getSort)
                .orderByAsc(NavMenu::getId));

        Map<Long, NavMenu> menuMap = allMenus.stream()
                .collect(Collectors.toMap(NavMenu::getId, m -> m));

        Map<Long, SysDomainMenu> domainMenuByMenuId = domainMenus.stream()
                .collect(Collectors.toMap(SysDomainMenu::getMenuId, dm -> dm, (a, b) -> a));

        Map<Long, SysDomainMenu> domainMenuById = domainMenus.stream()
                .collect(Collectors.toMap(SysDomainMenu::getId, dm -> dm));

        Map<Long, List<Long>> childrenMap = new LinkedHashMap<>();
        List<Long> rootMenuIds = new ArrayList<>();

        for (SysDomainMenu dm : domainMenus) {
            Long effectiveParentMenuId = getEffectiveParentMenuId(dm, domainMenuByMenuId, domainMenuById, menuMap);
            if (effectiveParentMenuId == null) {
                rootMenuIds.add(dm.getMenuId());
            } else {
                childrenMap.computeIfAbsent(effectiveParentMenuId, k -> new ArrayList<>()).add(dm.getMenuId());
            }
        }

        List<NavMenu> roots = rootMenuIds.stream()
                .map(menuMap::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        return buildDomainTree(roots, childrenMap, menuMap, domainMenuByMenuId, true);
    }

    private Long getEffectiveParentMenuId(SysDomainMenu dm,
                                          Map<Long, SysDomainMenu> domainMenuByMenuId,
                                          Map<Long, SysDomainMenu> domainMenuById,
                                          Map<Long, NavMenu> menuMap) {
        if (dm.getCustomParentId() != null) {
            SysDomainMenu parentDm = domainMenuById.get(dm.getCustomParentId());
            return parentDm != null ? parentDm.getMenuId() : null;
        }

        NavMenu navMenu = menuMap.get(dm.getMenuId());
        if (navMenu == null || navMenu.getParentId() == null || navMenu.getParentId() == 0) {
            return null;
        }

        if (domainMenuByMenuId.containsKey(navMenu.getParentId())) {
            return navMenu.getParentId();
        }

        return null;
    }

    private List<NavMenu> buildDomainTree(List<NavMenu> nodes,
                                          Map<Long, List<Long>> childrenMap,
                                          Map<Long, NavMenu> menuMap,
                                          Map<Long, SysDomainMenu> domainMenuByMenuId,
                                          boolean isRootLevel) {
        List<NavMenu> result = new ArrayList<>();
        for (NavMenu node : nodes) {
            SysDomainMenu dm = domainMenuByMenuId.get(node.getId());
            if (dm != null && dm.getCustomLabel() != null && !dm.getCustomLabel().isEmpty()) {
                node.setLabel(dm.getCustomLabel());
            }

            if (isRootLevel) {
                node.setParentId(0L);
            }

            List<Long> childMenuIds = childrenMap.getOrDefault(node.getId(), new ArrayList<>());
            if (!childMenuIds.isEmpty()) {
                List<NavMenu> children = childMenuIds.stream()
                        .map(menuMap::get)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());
                node.setChildren(buildDomainTree(children, childrenMap, menuMap, domainMenuByMenuId, false));
            } else {
                node.setChildren(null);
            }
            result.add(node);
        }
        return result;
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
