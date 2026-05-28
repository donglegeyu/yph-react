package com.material.server.entity;

import lombok.Data;
import java.util.List;

@Data
public class IconConfigRequest {
    private List<IconItem> preset;
    private List<IconItem> custom;

    @Data
    public static class IconItem {
        private String value;
        private String label;
    }
}
