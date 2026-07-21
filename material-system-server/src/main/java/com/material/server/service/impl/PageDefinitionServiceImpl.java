package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.material.server.common.BusinessException;
import com.material.server.dto.PageDefinitionDTO;
import com.material.server.entity.NavMenu;
import com.material.server.entity.PageDefinition;
import com.material.server.mapper.NavMenuMapper;
import com.material.server.mapper.PageDefinitionMapper;
import com.material.server.mapper.SysDomainMenuMapper;
import com.material.server.mapper.SysRoleMapper;
import com.material.server.mapper.SysRoleMenuMapper;
import com.material.server.mapper.SysUserMapper;
import com.material.server.mapper.SysUserRoleMapper;
import com.material.server.entity.SysDomain;
import com.material.server.entity.SysDomainMenu;
import com.material.server.entity.SysRole;
import com.material.server.entity.SysRoleMenu;
import com.material.server.entity.SysUser;
import com.material.server.entity.SysUserRole;
import com.material.server.mapper.SysDomainMapper;
import com.material.server.service.PageDefinitionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PageDefinitionServiceImpl
        extends ServiceImpl<PageDefinitionMapper, PageDefinition>
        implements PageDefinitionService {

    private final ObjectMapper objectMapper;
    private final NavMenuMapper navMenuMapper;
    private final SysDomainMapper sysDomainMapper;
    private final SysDomainMenuMapper sysDomainMenuMapper;
    private final SysRoleMapper sysRoleMapper;
    private final SysRoleMenuMapper sysRoleMenuMapper;
    private final SysUserMapper sysUserMapper;
    private final SysUserRoleMapper sysUserRoleMapper;

    @Override
    @Transactional
    public Long saveSchema(PageDefinitionDTO dto, String operator) {
        if (dto.getPageKey() == null || dto.getPageKey().trim().isEmpty()) {
            throw new BusinessException("pageKey 不能为空");
        }
        if (dto.getPageName() == null || dto.getPageName().trim().isEmpty()) {
            throw new BusinessException("pageName 不能为空");
        }

        // 唯一性校验
        Long existingId = parseLong(dto.getId());
        LambdaQueryWrapper<PageDefinition> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PageDefinition::getPageKey, dto.getPageKey());
        if (existingId != null) {
            wrapper.ne(PageDefinition::getId, existingId);
        }
        if (this.count(wrapper) > 0) {
            throw new BusinessException("pageKey 已存在：" + dto.getPageKey());
        }

        String schemaJson = serialize(dto);

        PageDefinition entity;
        if (existingId != null) {
            entity = this.getById(existingId);
            if (entity == null) {
                throw new BusinessException("页面定义不存在：" + dto.getId());
            }
        } else {
            entity = new PageDefinition();
            entity.setCreatedBy(operator);
            entity.setCreatedTime(LocalDateTime.now());
            entity.setStatus("draft");
        }

        entity.setPageKey(dto.getPageKey());
        entity.setPageName(dto.getPageName());
        entity.setTemplateType(dto.getTemplateType() != null ? dto.getTemplateType() : "smart-list");
        entity.setTableName(dto.getTableName());
        entity.setApiPrefix(dto.getApiPrefix());
        entity.setMenuLinkMode(dto.getMenuLinkMode() != null ? dto.getMenuLinkMode() : "new_child");
        entity.setParentMenuId(parseLong(dto.getParentMenuId()));
        entity.setBindMenuId(parseLong(dto.getBindMenuId()));
        entity.setSchemaJson(schemaJson);
        entity.setUpdatedTime(LocalDateTime.now());

        this.saveOrUpdate(entity);
        return entity.getId();
    }

    @Override
    @Transactional
    public void publish(Long id, Long domainId) {
        PageDefinition entity = this.getById(id);
        if (entity == null) {
            throw new BusinessException("页面定义不存在：" + id);
        }

        PageDefinitionDTO dto = deserialize(entity.getSchemaJson());
        if (dto == null) {
            throw new BusinessException("schema 解析失败");
        }

        // 1. 更新状态
        entity.setStatus("published");
        entity.setUpdatedTime(LocalDateTime.now());
        this.updateById(entity);

        // 2. 联动 nav_menu（菜单仅同步到当前域）
        try {
            syncMenu(entity, dto, domainId);
        } catch (Exception e) {
            log.error("发布时菜单联动失败 pageKey={}", dto.getPageKey(), e);
            throw new BusinessException("菜单联动失败：" + e.getMessage());
        }
    }

    @Override
    public PageDefinitionDTO getSchema(Long id) {
        PageDefinition entity = this.getById(id);
        if (entity == null) {
            throw new BusinessException("页面定义不存在：" + id);
        }
        PageDefinitionDTO dto = deserialize(entity.getSchemaJson());
        if (dto == null) {
            dto = new PageDefinitionDTO();
        }
        // 同步顶层字段
        dto.setId(String.valueOf(entity.getId()));
        dto.setPageKey(entity.getPageKey());
        dto.setPageName(entity.getPageName());
        dto.setStatus(entity.getStatus());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setCreatedTime(entity.getCreatedTime() != null ? entity.getCreatedTime().toString() : null);
        dto.setUpdatedTime(entity.getUpdatedTime() != null ? entity.getUpdatedTime().toString() : null);
        return dto;
    }

    // ============= 内部：菜单联动 =============

    private void syncMenu(PageDefinition entity, PageDefinitionDTO dto, Long domainId) {
        String path = "/dynamic/" + dto.getPageKey();
        String mode = entity.getMenuLinkMode() != null ? entity.getMenuLinkMode() : "new_child";

        if ("bind_existing".equals(mode)) {
            if (entity.getBindMenuId() == null) {
                throw new BusinessException("bind_existing 模式必须指定 bindMenuId");
            }
            NavMenu exist = navMenuMapper.selectById(entity.getBindMenuId());
            if (exist == null) {
                throw new BusinessException("要绑定的菜单不存在：" + entity.getBindMenuId());
            }
            exist.setPath(path);
            navMenuMapper.updateById(exist);
            log.info("菜单联动 - 更新已有菜单 path: menuId={}, path={}", exist.getId(), path);
            return;
        }

        // new_child 模式
        if (entity.getParentMenuId() == null) {
            throw new BusinessException("new_child 模式必须指定 parentMenuId");
        }

        // 幂等：按 key 查是否已创建过
        String childKey = "dynamic-" + dto.getPageKey();
        LambdaQueryWrapper<NavMenu> query = new LambdaQueryWrapper<>();
        query.eq(NavMenu::getKey, childKey);
        NavMenu existing = navMenuMapper.selectOne(query);

        Long menuId;
        if (existing != null) {
            // 已存在，更新 label/path
            existing.setLabel(dto.getPageName());
            existing.setPath(path);
            navMenuMapper.updateById(existing);
            menuId = existing.getId();
            log.info("菜单联动 - 子菜单已存在，更新: key={}", childKey);
        } else {
            NavMenu child = new NavMenu();
            child.setKey(childKey);
            child.setLabel(dto.getPageName());
            child.setPath(path);
            child.setParentId(entity.getParentMenuId());
            child.setLevel(2);
            child.setMenuType("业务菜单");
            child.setIcon("app");
            child.setSort(99);
            child.setStatus(1);
            child.setVisible(1);
            navMenuMapper.insert(child);
            menuId = child.getId();
            log.info("菜单联动 - 新建子菜单: key={}, id={}", childKey, menuId);
        }

        // 仅同步到当前域（不跨域开放；其他域需管理员在「域管理」手动开放）
        if (domainId != null) {
            syncDomainMenu(menuId, entity.getParentMenuId(), domainId);
        } else {
            log.warn("菜单联动 - 未传入 domainId，跳过域同步: menuId={}", menuId);
        }
        // 同步给 admin + 创建者角色（保证创建者本人可见）
        syncRoleMenuForPublisher(menuId, entity.getCreatedBy());
    }

    /**
     * 仅把菜单挂到当前域（幂等）。不再遍历所有启用域。
     */
    private void syncDomainMenu(Long menuId, Long parentMenuId, Long domainId) {
        LambdaQueryWrapper<SysDomainMenu> q = new LambdaQueryWrapper<>();
        q.eq(SysDomainMenu::getDomainId, domainId)
                .eq(SysDomainMenu::getMenuId, menuId);
        if (sysDomainMenuMapper.selectCount(q) == 0) {
            SysDomainMenu sdm = new SysDomainMenu();
            sdm.setDomainId(domainId);
            sdm.setMenuId(menuId);
            sdm.setCustomParentId(parentMenuId);
            sdm.setCustomLevel(2);
            sysDomainMenuMapper.insert(sdm);
        }
    }

    /**
     * 把菜单同步给「admin 角色 + 创建者所属的所有角色」，确保创建者本人发布后立即可见。
     * 其他角色不自动同步，需管理员在「角色管理」手动分配。
     */
    private void syncRoleMenuForPublisher(Long menuId, String createdBy) {
        Set<Long> targetRoleIds = new HashSet<>();

        // admin 角色
        LambdaQueryWrapper<SysRole> roleQuery = new LambdaQueryWrapper<>();
        roleQuery.eq(SysRole::getRoleCode, "ROLE_ADMIN");
        List<SysRole> admins = sysRoleMapper.selectList(roleQuery);
        admins.forEach(r -> targetRoleIds.add(r.getId()));

        // 创建者所属的所有角色
        if (createdBy != null && !createdBy.isEmpty()) {
            LambdaQueryWrapper<SysUser> userQuery = new LambdaQueryWrapper<>();
            userQuery.eq(SysUser::getUsername, createdBy);
            SysUser user = sysUserMapper.selectOne(userQuery);
            if (user == null) {
                log.warn("菜单联动 - 创建者用户不存在: createdBy={}, 仅同步 admin 角色", createdBy);
            } else {
                List<SysUserRole> userRoles = sysUserRoleMapper.selectList(
                        new LambdaQueryWrapper<SysUserRole>().eq(SysUserRole::getUserId, user.getId()));
                if (userRoles.isEmpty()) {
                    log.warn("菜单联动 - 创建者无任何角色: createdBy={}, 仅同步 admin 角色", createdBy);
                } else {
                    userRoles.forEach(ur -> targetRoleIds.add(ur.getRoleId()));
                }
            }
        } else {
            log.warn("菜单联动 - createdBy 为空，仅同步 admin 角色: menuId={}", menuId);
        }

        // 幂等插入 sys_role_menu
        for (Long roleId : targetRoleIds) {
            LambdaQueryWrapper<SysRoleMenu> q = new LambdaQueryWrapper<>();
            q.eq(SysRoleMenu::getRoleId, roleId)
                    .eq(SysRoleMenu::getMenuId, menuId);
            if (sysRoleMenuMapper.selectCount(q) == 0) {
                SysRoleMenu srm = new SysRoleMenu();
                srm.setRoleId(roleId);
                srm.setMenuId(menuId);
                sysRoleMenuMapper.insert(srm);
            }
        }
        log.info("菜单联动 - 角色权限已同步: menuId={}, roleIds={}", menuId, targetRoleIds);
    }

    // ============= 工具方法 =============

    private String serialize(PageDefinitionDTO dto) {
        try {
            return objectMapper.writeValueAsString(dto);
        } catch (Exception e) {
            throw new BusinessException("schema 序列化失败：" + e.getMessage());
        }
    }

    private PageDefinitionDTO deserialize(String json) {
        if (json == null || json.trim().isEmpty()) return null;
        try {
            return objectMapper.readValue(json, PageDefinitionDTO.class);
        } catch (Exception e) {
            log.error("schema 反序列化失败", e);
            return null;
        }
    }

    private Long parseLong(String s) {
        if (s == null || s.trim().isEmpty()) return null;
        try {
            return Long.parseLong(s.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
