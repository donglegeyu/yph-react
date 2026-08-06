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

import java.io.Serializable;
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
        entity.setUpdatedBy(operator);
        entity.setUpdatedTime(LocalDateTime.now());

        this.saveOrUpdate(entity);
        return entity.getId();
    }

    @Override
    @Transactional
    public void publish(Long id, Long domainId, String operator) {
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
        entity.setUpdatedBy(operator);
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
    @Transactional
    public boolean removeById(Serializable id) {
        PageDefinition entity = this.getById(id);
        if (entity == null) {
            return false;
        }

        // 仅对发布过的配置做菜单联动清理（草稿从未写入菜单，无需处理）
        if ("published".equals(entity.getStatus())) {
            try {
                cleanupMenu(entity);
            } catch (Exception e) {
                log.error("删除时菜单联动清理失败 pageDefinitionId={}", id, e);
                throw new BusinessException("菜单联动清理失败：" + e.getMessage());
            }
        }

        return super.removeById(id);
    }

    /**
     * 删除页面配置时的菜单反向联动：
     * - new_child 模式：级联删除发布时创建的子菜单及其域/角色关联
     * - bind_existing 模式：把菜单 path 还原为发布前的原值
     */
    private void cleanupMenu(PageDefinition entity) {
        String mode = entity.getMenuLinkMode() != null ? entity.getMenuLinkMode() : "new_child";

        if ("bind_existing".equals(mode)) {
            restoreBindMenuPath(entity);
            return;
        }

        // new_child 模式：按 key 定位发布时创建的子菜单
        String childKey = "dynamic-" + entity.getPageKey();
        LambdaQueryWrapper<NavMenu> q = new LambdaQueryWrapper<>();
        q.eq(NavMenu::getKey, childKey);
        NavMenu child = navMenuMapper.selectOne(q);
        if (child == null) {
            log.warn("删除联动 - 子菜单不存在，跳过: key={}", childKey);
            return;
        }
        Long menuId = child.getId();
        cascadeDeleteMenu(menuId);
        log.info("删除联动 - 已级联删除子菜单: key={}, menuId={}", childKey, menuId);
    }

    /**
     * bind_existing 模式：还原菜单 path 为发布前的原值。
     * original_menu_path 为空（旧数据/异常情况）时清空 path，避免指向已删除的动态页。
     */
    private void restoreBindMenuPath(PageDefinition entity) {
        if (entity.getBindMenuId() == null) {
            log.warn("删除联动 - bind_existing 无 bindMenuId，跳过: pageDefinitionId={}", entity.getId());
            return;
        }
        NavMenu menu = navMenuMapper.selectById(entity.getBindMenuId());
        if (menu == null) {
            log.warn("删除联动 - 绑定的菜单已不存在，跳过: bindMenuId={}", entity.getBindMenuId());
            return;
        }
        String original = entity.getOriginalMenuPath();
        // 还原到原 path；若原 path 缺失，置空避免指向已删除的 /dynamic/{pageKey}
        menu.setPath(original);
        navMenuMapper.updateById(menu);
        log.info("删除联动 - 已还原菜单 path: menuId={}, path={}", menu.getId(), original);
    }

    /**
     * 级联删除菜单：sys_role_menu → sys_domain_menu → nav_menu（均按 menuId 关联）
     * nav_menu 走 MyBatis-Plus 逻辑删除（@TableLogic），其余两表为物理删除（无 deleted 字段）。
     */
    private void cascadeDeleteMenu(Long menuId) {
        // 1. sys_role_menu（物理删除）
        LambdaQueryWrapper<SysRoleMenu> rmQ = new LambdaQueryWrapper<>();
        rmQ.eq(SysRoleMenu::getMenuId, menuId);
        sysRoleMenuMapper.delete(rmQ);

        // 2. sys_domain_menu（物理删除）
        LambdaQueryWrapper<SysDomainMenu> dmQ = new LambdaQueryWrapper<>();
        dmQ.eq(SysDomainMenu::getMenuId, menuId);
        sysDomainMenuMapper.delete(dmQ);

        // 3. nav_menu（逻辑删除）
        navMenuMapper.deleteById(menuId);
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
        // 详情页等不需要菜单挂载的场景：generateMenu=false 时跳过菜单联动
        if (Boolean.FALSE.equals(dto.getGenerateMenu())) {
            log.info("菜单联动 - 跳过（generateMenu=false）pageKey={}", dto.getPageKey());
            return;
        }
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
            // 首次绑定时记录原 path，删除时用于还原；后续重复发布不覆盖
            if (entity.getOriginalMenuPath() == null) {
                entity.setOriginalMenuPath(exist.getPath());
                this.updateById(entity);
                log.info("菜单联动 - 记录原 path: menuId={}, originalPath={}", exist.getId(), exist.getPath());
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
     * 把菜单同步给「所有启用角色」，确保发布后所有用户可见。
     * 动态生成的业务菜单默认开放，如需细粒度控制可在「角色管理」调整。
     */
    private void syncRoleMenuForPublisher(Long menuId, String createdBy) {
        // 取所有启用角色
        LambdaQueryWrapper<SysRole> roleQuery = new LambdaQueryWrapper<>();
        roleQuery.eq(SysRole::getStatus, 1);
        List<SysRole> activeRoles = sysRoleMapper.selectList(roleQuery);
        Set<Long> targetRoleIds = new HashSet<>();
        activeRoles.forEach(r -> targetRoleIds.add(r.getId()));

        if (createdBy != null && !createdBy.isEmpty()) {
            log.info("菜单联动 - 发布者: {}, 同步给所有启用角色: {}", createdBy, targetRoleIds);
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
