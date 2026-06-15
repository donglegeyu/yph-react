package com.material.server.service;

import com.material.server.dto.UserPermissionVO;

public interface SysPermissionService {

    UserPermissionVO getUserPermissions(Long userId);
}
