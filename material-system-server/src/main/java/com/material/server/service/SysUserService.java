package com.material.server.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.material.server.dto.SysUserVO;
import com.material.server.entity.SysDomain;
import com.material.server.entity.SysUser;

import java.util.List;

public interface SysUserService extends IService<SysUser> {

    IPage<SysUserVO> page(Page<SysUser> page, String username, Integer status, Long deptId);

    SysUserVO getDetailById(Long id);

    SysUser create(SysUser user, List<Long> roleIds);

    void update(Long id, SysUser user, List<Long> roleIds);

    void updateStatus(Long id, Integer status);

    void resetPassword(Long id);

    void assignDomains(Long userId, Long[] domainIds);

    List<SysDomain> getUserDomains(Long userId);
}
