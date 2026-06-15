package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.entity.SysRole;
import com.material.server.entity.SysRoleDept;
import com.material.server.entity.SysRoleMenu;
import com.material.server.entity.SysUserRole;
import com.material.server.mapper.SysRoleDeptMapper;
import com.material.server.mapper.SysRoleMapper;
import com.material.server.mapper.SysRoleMenuMapper;
import com.material.server.mapper.SysUserRoleMapper;
import com.material.server.service.SysRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SysRoleServiceImpl extends ServiceImpl<SysRoleMapper, SysRole> implements SysRoleService {

    private final SysRoleMenuMapper sysRoleMenuMapper;
    private final SysRoleDeptMapper sysRoleDeptMapper;
    private final SysUserRoleMapper sysUserRoleMapper;

    @Override
    public IPage<SysRole> page(Page<SysRole> page, String roleName, Integer status) {
        LambdaQueryWrapper<SysRole> query = new LambdaQueryWrapper<>();
        if (roleName != null && !roleName.isEmpty()) {
            query.like(SysRole::getRoleName, roleName);
        }
        if (status != null) {
            query.eq(SysRole::getStatus, status);
        }
        query.orderByAsc(SysRole::getSortOrder);
        return page(page, query);
    }

    @Override
    public List<SysRole> listAll() {
        LambdaQueryWrapper<SysRole> query = new LambdaQueryWrapper<>();
        query.eq(SysRole::getStatus, 1);
        query.orderByAsc(SysRole::getSortOrder);
        return list(query);
    }

    @Override
    @Transactional
    public SysRole create(SysRole role) {
        save(role);
        return role;
    }

    @Override
    @Transactional
    public void update(Long id, SysRole role) {
        role.setId(id);
        updateById(role);
    }

    @Override
    @Transactional
    public void updateStatus(Long id, Integer status) {
        SysRole role = new SysRole();
        role.setId(id);
        role.setStatus(status);
        updateById(role);
    }

    @Override
    @Transactional
    public void assignMenus(Long roleId, List<Long> menuIds) {
        LambdaQueryWrapper<SysRoleMenu> query = new LambdaQueryWrapper<>();
        query.eq(SysRoleMenu::getRoleId, roleId);
        sysRoleMenuMapper.delete(query);

        if (menuIds != null && !menuIds.isEmpty()) {
            List<SysRoleMenu> list = menuIds.stream().map(menuId -> {
                SysRoleMenu rm = new SysRoleMenu();
                rm.setRoleId(roleId);
                rm.setMenuId(menuId);
                return rm;
            }).collect(Collectors.toList());
            list.forEach(sysRoleMenuMapper::insert);
        }
    }

    @Override
    public List<Long> getRoleMenuIds(Long roleId) {
        LambdaQueryWrapper<SysRoleMenu> query = new LambdaQueryWrapper<>();
        query.eq(SysRoleMenu::getRoleId, roleId);
        return sysRoleMenuMapper.selectList(query).stream()
                .map(SysRoleMenu::getMenuId)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void assignDataScope(Long roleId, Integer dataScope, List<Long> deptIds) {
        SysRole role = new SysRole();
        role.setId(roleId);
        role.setDataScope(dataScope);
        updateById(role);

        // 先清空旧的角色-部门关联
        LambdaQueryWrapper<SysRoleDept> query = new LambdaQueryWrapper<>();
        query.eq(SysRoleDept::getRoleId, roleId);
        sysRoleDeptMapper.delete(query);

        // data_scope=2(自定义部门) 时才需要存 deptIds
        if (dataScope != null && dataScope == 2 && deptIds != null && !deptIds.isEmpty()) {
            for (Long deptId : deptIds) {
                SysRoleDept rd = new SysRoleDept();
                rd.setRoleId(roleId);
                rd.setDeptId(deptId);
                sysRoleDeptMapper.insert(rd);
            }
        }
    }

    @Override
    public List<Long> getRoleDeptIds(Long roleId) {
        LambdaQueryWrapper<SysRoleDept> query = new LambdaQueryWrapper<>();
        query.eq(SysRoleDept::getRoleId, roleId);
        return sysRoleDeptMapper.selectList(query).stream()
                .map(SysRoleDept::getDeptId)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void removeWithCheck(Long id) {
        LambdaQueryWrapper<SysUserRole> userQuery = new LambdaQueryWrapper<>();
        userQuery.eq(SysUserRole::getRoleId, id);
        long userCount = sysUserRoleMapper.selectCount(userQuery);
        if (userCount > 0) {
            throw new IllegalStateException("角色已分配给用户，不允许删除");
        }
        // 清理关联
        LambdaQueryWrapper<SysRoleMenu> menuQuery = new LambdaQueryWrapper<>();
        menuQuery.eq(SysRoleMenu::getRoleId, id);
        sysRoleMenuMapper.delete(menuQuery);

        LambdaQueryWrapper<SysRoleDept> deptQuery = new LambdaQueryWrapper<>();
        deptQuery.eq(SysRoleDept::getRoleId, id);
        sysRoleDeptMapper.delete(deptQuery);

        removeById(id);
    }

    public List<SysRole> getRolesByUserId(Long userId) {
        LambdaQueryWrapper<SysUserRole> query = new LambdaQueryWrapper<>();
        query.eq(SysUserRole::getUserId, userId);
        List<Long> roleIds = sysUserRoleMapper.selectList(query).stream()
                .map(SysUserRole::getRoleId)
                .collect(Collectors.toList());
        if (roleIds.isEmpty()) {
            return new ArrayList<>();
        }
        return listByIds(roleIds);
    }
}
