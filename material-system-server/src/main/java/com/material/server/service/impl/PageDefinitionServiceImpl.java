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
import com.material.server.entity.SysDomain;
import com.material.server.entity.SysDomainMenu;
import com.material.server.entity.SysRole;
import com.material.server.entity.SysRoleMenu;
import com.material.server.mapper.SysDomainMapper;
import com.material.server.service.PageDefinitionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

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
    public void publish(Long id) {
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

        // 2. 联动 nav_menu
        try {
            syncMenu(entity, dto);
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

    private void syncMenu(PageDefinition entity, PageDefinitionDTO dto) {
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

        if (existing != null) {
            // 已存在，更新 label/path
            existing.setLabel(dto.getPageName());
            existing.setPath(path);
            navMenuMapper.updateById(existing);
            log.info("菜单联动 - 子菜单已存在，更新: key={}", childKey);
            return;
        }

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
        log.info("菜单联动 - 新建子菜单: key={}, id={}", childKey, child.getId());

        // 同步默认域
        syncDefaultDomainMenu(child.getId());
        // 同步超管角色权限
        syncAdminRoleMenu(child.getId());
    }

    private void syncDefaultDomainMenu(Long menuId) {
        LambdaQueryWrapper<SysDomain> domainQuery = new LambdaQueryWrapper<>();
        domainQuery.eq(SysDomain::getIsDefault, 1)
                .eq(SysDomain::getStatus, 1);
        List<SysDomain> defaultDomains = sysDomainMapper.selectList(domainQuery);
        for (SysDomain domain : defaultDomains) {
            LambdaQueryWrapper<SysDomainMenu> q = new LambdaQueryWrapper<>();
            q.eq(SysDomainMenu::getDomainId, domain.getId())
                    .eq(SysDomainMenu::getMenuId, menuId);
            if (sysDomainMenuMapper.selectCount(q) == 0) {
                SysDomainMenu sdm = new SysDomainMenu();
                sdm.setDomainId(domain.getId());
                sdm.setMenuId(menuId);
                sysDomainMenuMapper.insert(sdm);
            }
        }
    }

    private void syncAdminRoleMenu(Long menuId) {
        LambdaQueryWrapper<SysRole> roleQuery = new LambdaQueryWrapper<>();
        roleQuery.eq(SysRole::getRoleCode, "ROLE_ADMIN");
        List<SysRole> admins = sysRoleMapper.selectList(roleQuery);
        for (SysRole role : admins) {
            LambdaQueryWrapper<SysRoleMenu> q = new LambdaQueryWrapper<>();
            q.eq(SysRoleMenu::getRoleId, role.getId())
                    .eq(SysRoleMenu::getMenuId, menuId);
            if (sysRoleMenuMapper.selectCount(q) == 0) {
                SysRoleMenu srm = new SysRoleMenu();
                srm.setRoleId(role.getId());
                srm.setMenuId(menuId);
                sysRoleMenuMapper.insert(srm);
            }
        }
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
