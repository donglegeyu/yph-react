package com.material.server.auth;

import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * JWT 签发与校验。密钥优先取环境变量 YPH_JWT_SECRET，其次 app.jwt.secret；
 * 两者都没有时使用仅用于本地开发的默认值，生产必须显式配置。
 */
@Component
public class JwtUtils {

    private static final String ISSUER = "yph";

    private final Algorithm algorithm;
    private final JWTVerifier verifier;
    private final long expireSeconds;

    public JwtUtils(
            @Value("${YPH_JWT_SECRET:${app.jwt.secret:yph-dev-secret-change-me-please-32bytes-min}}") String secret,
            @Value("${app.jwt.expire-seconds:28800}") long expireSeconds) {
        if (secret == null || secret.getBytes().length < 32) {
            throw new IllegalStateException("JWT 密钥长度必须不少于 32 字节，请配置 YPH_JWT_SECRET");
        }
        this.algorithm = Algorithm.HMAC256(secret);
        this.verifier = JWT.require(algorithm).withIssuer(ISSUER).build();
        this.expireSeconds = expireSeconds;
    }

    public TokenResult createToken(Long userId, String username, Long deptId,
                                   List<String> roles, List<String> perms) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(expireSeconds, ChronoUnit.SECONDS);
        var builder = JWT.create()
                .withIssuer(ISSUER)
                .withSubject(String.valueOf(userId))
                .withClaim("username", username)
                .withIssuedAt(Date.from(now))
                .withExpiresAt(Date.from(expiresAt))
                .withArrayClaim("roles", toArray(roles))
                .withArrayClaim("perms", toArray(perms));
        if (deptId != null) {
            builder.withClaim("deptId", deptId);
        }
        return new TokenResult(builder.sign(algorithm), expiresAt.toEpochMilli());
    }

    public UserContext.JwtUser verify(String token) throws JWTVerificationException {
        DecodedJWT jwt = verifier.verify(token);
        List<String> roles = readList(jwt, "roles");
        List<String> perms = readList(jwt, "perms");
        Long deptId = jwt.getClaim("deptId").isNull() ? null : jwt.getClaim("deptId").asLong();
        return new UserContext.JwtUser(
                Long.valueOf(jwt.getSubject()),
                jwt.getClaim("username").asString(),
                deptId,
                roles,
                perms,
                jwt.getExpiresAtAsInstant() == null ? 0L : jwt.getExpiresAtAsInstant().toEpochMilli()
        );
    }

    private static String[] toArray(List<String> values) {
        return values == null ? new String[0] : values.toArray(new String[0]);
    }

    private static List<String> readList(DecodedJWT jwt, String name) {
        List<String> values = jwt.getClaim(name).asList(String.class);
        return values == null ? new ArrayList<>() : new ArrayList<>(values);
    }

    public record TokenResult(String token, long expiresAt) {
    }
}
