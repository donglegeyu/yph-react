package com.material.server.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class SysUserVO {
    private Long id;
    private String username;
    private String nickname;
    private Integer status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private List<DomainBrief> domains;

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
}
