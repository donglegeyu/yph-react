package com.material.server.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class SysUserVO {
    private Long id;
    private String username;
    private String nickname;
    private String realName;
    private Long deptId;
    private String deptName;
    private Long companyId;
    private String companyName;
    private String phone;
    private String email;
    private Integer status;
    private LocalDateTime lastLoginTime;
    private String lastLoginIp;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private List<DomainBrief> domains;
    private List<RoleBrief> roles;

    @Data
    public static class DomainBrief {
        private Long id;
        private String domainName;

        public DomainBrief() {
        }

        public DomainBrief(Long id, String domainName) {
            this.id = id;
            this.domainName = domainName;
        }
    }

    @Data
    public static class RoleBrief {
        private Long id;
        private String roleName;
        private String roleCode;

        public RoleBrief() {
        }

        public RoleBrief(Long id, String roleName, String roleCode) {
            this.id = id;
            this.roleName = roleName;
            this.roleCode = roleCode;
        }
    }
}
