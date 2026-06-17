package com.material.server.dto;

import lombok.Data;

@Data
public class LoginResult {
    private String token;
    private Long id;
    private String username;
    private String nickname;
    private String realName;
    private Long deptId;
    private String deptName;
    private String phone;
    private String email;
}
