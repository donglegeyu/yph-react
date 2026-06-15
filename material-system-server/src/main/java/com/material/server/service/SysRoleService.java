package com.material.server.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.material.server.entity.SysRole;

import java.util.List;

public interface SysRoleService extends IService<SysRole> {

    IPage<SysRole> page(Page<SysRole> page, String roleName, Integer status);

    List<SysRole> listAll();

    SysRole create(SysRole role);

    void update(Long id, SysRole role);

    void updateStatus(Long id, Integer status);

    void assignMenus(Long roleId, List<Long> menuIds);

    List<Long> getRoleMenuIds(Long roleId);

    void assignDataScope(Long roleId, Integer dataScope, List<Long> deptIds);

    List<Long> getRoleDeptIds(Long roleId);

    void removeWithCheck(Long id);
}
