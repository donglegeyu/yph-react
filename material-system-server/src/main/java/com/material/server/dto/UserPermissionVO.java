package com.material.server.dto;

import lombok.Data;

import java.util.List;

@Data
public class UserPermissionVO {
    private Long userId;
    private String username;
    private String nickname;
    private Long deptId;
    private String deptName;
    private Long companyId;
    private String companyName;

    private List<RoleBrief> roles;
    private List<MenuNode> menus;
    private List<String> permissions;
    private DataScopeInfo dataScope;

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

    @Data
    public static class MenuNode {
        private Long id;
        private String key;
        private String label;
        private String path;
        private String menuCategory;
        private Long parentId;
        private List<MenuNode> children;
    }

    @Data
    public static class DataScopeInfo {
        private Integer type;
        private String description;
        private List<Long> deptIds;
        private List<String> deptNames;
    }
}
