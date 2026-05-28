package com.material.server.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.material.server.entity.SysDomain;
import com.material.server.entity.SysUser;

import java.util.List;

public interface SysUserService extends IService<SysUser> {

    IPage<SysUser> page(Page<SysUser> page, String username, Integer status);

    SysUser create(SysUser user);

    void update(Long id, SysUser user);

    void updateStatus(Long id, Integer status);

    void assignDomains(Long userId, Long[] domainIds);

    List<SysDomain> getUserDomains(Long userId);
}
