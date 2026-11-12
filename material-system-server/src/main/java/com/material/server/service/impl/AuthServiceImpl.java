package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.material.server.auth.JwtUtils;
import com.material.server.common.BusinessException;
import com.material.server.dto.LoginResult;
import com.material.server.dto.UserPermissionVO;
import com.material.server.entity.SysDept;
import com.material.server.entity.SysUser;
import com.material.server.mapper.SysDeptMapper;
import com.material.server.mapper.SysUserMapper;
import com.material.server.service.AuthService;
import com.material.server.service.SysPermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final SysUserMapper sysUserMapper;
    private final SysDeptMapper sysDeptMapper;
    private final SysPermissionService sysPermissionService;
    private final JwtUtils jwtUtils;

    @Override
    public LoginResult login(String username, String password, String loginIp) {
        if (username == null || username.isEmpty()) {
            throw new BusinessException(400, "用户名不能为空");
        }
        if (password == null || password.isEmpty()) {
            throw new BusinessException(400, "密码不能为空");
        }

        LambdaQueryWrapper<SysUser> query = new LambdaQueryWrapper<>();
        query.eq(SysUser::getUsername, username);
        query.last("LIMIT 1");
        SysUser user = sysUserMapper.selectOne(query);

        if (user == null) {
            throw new BusinessException(401, "用户名或密码错误");
        }
        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new BusinessException(403, "账号已被停用，请联系管理员");
        }
        if (!password.equals(user.getPassword())) {
            throw new BusinessException(401, "用户名或密码错误");
        }

        SysUser update = new SysUser();
        update.setId(user.getId());
        update.setLastLoginTime(LocalDateTime.now());
        update.setLastLoginIp(loginIp);
        sysUserMapper.updateById(update);

        LoginResult result = new LoginResult();

        List<String> roles = new ArrayList<>();
        List<String> perms = new ArrayList<>();
        UserPermissionVO permission = sysPermissionService.getUserPermissions(user.getId());
        if (permission != null) {
            if (permission.getRoles() != null) {
                permission.getRoles().forEach(role -> roles.add(role.getRoleCode()));
            }
            if (roles.contains("ROLE_ADMIN")) {
                perms.add("*");
            } else if (permission.getPermissions() != null) {
                perms.addAll(permission.getPermissions());
            }
        }

        JwtUtils.TokenResult token = jwtUtils.createToken(
                user.getId(), user.getUsername(), user.getDeptId(), roles, perms);
        result.setToken(token.token());
        result.setExpiresAt(token.expiresAt());
        result.setRoles(roles);
        result.setPerms(perms);

        result.setId(user.getId());
        result.setUsername(user.getUsername());
        result.setNickname(user.getNickname());
        result.setRealName(user.getRealName());
        result.setDeptId(user.getDeptId());
        result.setPhone(user.getPhone());
        result.setEmail(user.getEmail());
        if (user.getDeptId() != null) {
            SysDept dept = sysDeptMapper.selectById(user.getDeptId());
            if (dept != null) {
                result.setDeptName(dept.getDeptName());
            }
        }
        return result;
    }
}
