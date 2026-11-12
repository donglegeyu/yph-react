package com.material.approval.auth;

import java.util.List;

public record CurrentUser(Long userId, String username, Long deptId, List<String> roles, List<String> perms) {

    public boolean hasPerm(String code) {
        if (perms == null || perms.isEmpty()) {
            return false;
        }
        return perms.contains("*") || perms.contains(code);
    }

    public boolean hasRole(String role) {
        return roles != null && roles.contains(role);
    }
}
