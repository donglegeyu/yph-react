package com.material.approval.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtVerifier jwtVerifier;
    private final ObjectMapper objectMapper;

    public AuthInterceptor(JwtVerifier jwtVerifier, ObjectMapper objectMapper) {
        this.jwtVerifier = jwtVerifier;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod()) || !(handler instanceof HandlerMethod method)) {
            return true;
        }

        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            writeError(response, 401, "未登录或登录已过期");
            return false;
        }

        CurrentUser user;
        try {
            user = jwtVerifier.verify(authorization.substring(7).trim());
        } catch (Exception e) {
            writeError(response, 401, "登录凭证无效或已过期");
            return false;
        }
        UserContext.set(user);

        RequirePerm requirePerm = method.getMethodAnnotation(RequirePerm.class);
        if (requirePerm == null) {
            requirePerm = method.getBeanType().getAnnotation(RequirePerm.class);
        }
        if (requirePerm != null && !user.hasPerm(requirePerm.value())) {
            writeError(response, 403, "无权限执行该操作");
            return false;
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserContext.clear();
    }

    private void writeError(HttpServletResponse response, int code, String message) throws Exception {
        response.setStatus(code);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write(objectMapper.writeValueAsString(Map.of(
                "code", code, "message", message, "success", false)));
    }
}
