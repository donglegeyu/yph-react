package com.material.server.auth;

import java.util.List;

/**
 * 当前请求的登录用户上下文。由 AuthInterceptor 写入，请求结束后清理。
 */
public final class UserContext {

    private static final ThreadLocal<JwtUser> HOLDER = new ThreadLocal<>();

    private UserContext() {
    }

    public static void set(JwtUser user) {
        HOLDER.set(user);
    }

    public static JwtUser get() {
        return HOLDER.get();
    }

    public static void clear() {
        HOLDER.remove();
    }

    public record JwtUser(
            Long userId,
            String username,
            Long deptId,
            List<String> roles,
            List<String> perms,
            long expiresAt
    ) {
        public boolean isAdmin() {
            return roles != null && roles.contains("ROLE_ADMIN");
        }

        public boolean hasPerm(String code) {
            return isAdmin() || (perms != null && (perms.contains("*") || perms.contains(code)));
        }
    }
}
