package com.material.server.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 接口级权限码校验。权限码格式：{module}:{resource}:{action}。
 * 由 AuthInterceptor 读取并与 JWT 中的 perms 比对；ROLE_ADMIN 直接放行。
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePerm {

    String value();
}
