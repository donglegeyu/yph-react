package com.material.server.dto;

import lombok.Data;

import java.util.List;

@Data
public class LoginResult {
    private String token;
    private Long expiresAt;
    private List<String> roles;
    private List<String> perms;
    private Long id;
    private String username;
    private String nickname;
    private String realName;
    private Long deptId;
    private String deptName;
    private String phone;
    private String email;
}
