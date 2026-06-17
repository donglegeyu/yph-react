package com.material.server.service;

import com.material.server.dto.LoginResult;

public interface AuthService {

    LoginResult login(String username, String password, String loginIp);
}
