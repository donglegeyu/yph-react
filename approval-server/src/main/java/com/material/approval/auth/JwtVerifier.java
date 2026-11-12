package com.material.approval.auth;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.auth0.jwt.interfaces.JWTVerifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;

/**
 * 校验主服务签发的 JWT（跨服务身份来源，契约见施工单 2）。
 */
@Component
public class JwtVerifier {

    private final JWTVerifier verifier;

    public JwtVerifier(@Value("${app.jwt.secret}") String secret) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT 密钥长度不足 32 字节，请配置 YPH_JWT_SECRET");
        }
        this.verifier = JWT.require(Algorithm.HMAC256(secret)).withIssuer("yph").build();
    }

    public CurrentUser verify(String token) {
        DecodedJWT jwt = verifier.verify(token);
        List<String> roles = readList(jwt, "roles");
        List<String> perms = readList(jwt, "perms");
        Long deptId = jwt.getClaim("deptId").isNull() ? null : jwt.getClaim("deptId").asLong();
        return new CurrentUser(Long.valueOf(jwt.getSubject()), jwt.getClaim("username").asString(), deptId, roles, perms);
    }

    private List<String> readList(DecodedJWT jwt, String name) {
        if (jwt.getClaim(name).isNull()) {
            return Collections.emptyList();
        }
        List<String> values = jwt.getClaim(name).asList(String.class);
        return values == null ? Collections.emptyList() : values;
    }
}
