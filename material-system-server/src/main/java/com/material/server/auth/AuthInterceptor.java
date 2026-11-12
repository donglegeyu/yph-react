package com.material.server.auth;

import com.auth0.jwt.exceptions.JWTVerificationException;
import com.material.server.annotation.RequirePerm;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.List;

/**
 * 登录态与权限码拦截器。
 *
 * P0 兼容模式：未携带 token 的旧接口请求暂不强制 401（前端仍有大量原生 fetch 未带
 * Authorization），但带 token 的请求必须验签通过；所有标注 @RequirePerm 的接口
 * 无论是否带 token 都必须登录且具备权限码。待前端原生 fetch 统一改造后再收紧为全量强制登录。
 */
@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private static final AntPathMatcher MATCHER = new AntPathMatcher();

    private static final List<String> WHITELIST = List.of(
            "/api/auth/login",
            "/uploads/**",
            "/error",
            "/v3/api-docs/**",
            "/swagger-ui/**"
    );

    private final JwtUtils jwtUtils;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        String path = request.getRequestURI();
        if (isWhitelisted(request, path)) {
            return true;
        }

        RequirePerm requirePerm = handlerMethod.getMethodAnnotation(RequirePerm.class);
        if (requirePerm == null) {
            requirePerm = handlerMethod.getBeanType().getAnnotation(RequirePerm.class);
        }

        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            if (requirePerm != null) {
                writeError(response, 401, "未登录或登录已过期");
                return false;
            }
            // 兼容模式：旧接口未强制要求登录
            return true;
        }

        UserContext.JwtUser user;
        try {
            user = jwtUtils.verify(authorization.substring(7).trim());
        } catch (JWTVerificationException | IllegalArgumentException ex) {
            writeError(response, 401, "登录状态无效，请重新登录");
            return false;
        }
        UserContext.set(user);

        if (requirePerm != null && !user.hasPerm(requirePerm.value())) {
            writeError(response, 403, "无权限执行该操作");
            return false;
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        UserContext.clear();
    }

    private boolean isWhitelisted(HttpServletRequest request, String path) {
        if ("GET".equalsIgnoreCase(request.getMethod()) && "/api/nav-menus".equals(path)) {
            return true;
        }
        return WHITELIST.stream().anyMatch(pattern -> MATCHER.match(pattern, path));
    }

    private void writeError(HttpServletResponse response, int code, String message) throws IOException {
        response.setStatus(code);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(
                "{\"code\":" + code + ",\"message\":\"" + message + "\",\"data\":null}");
    }
}
