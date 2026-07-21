package com.material.server.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

/**
 * 页面定义 DTO（与前端 PageDefinitionDTO 结构对齐）
 * 用作 schema_json 的序列化载体
 */
@Data
public class PageDefinitionDTO {

    private String id;
    private String pageKey;
    private String pageName;
    private String templateType;
    private String tableName;
    private Boolean isNewTable;
    private String apiPrefix;
    private Boolean generateMenu;
    private String menuLinkMode;
    private String parentMenuId;
    private String bindMenuId;

    private TreeConfig treeConfig;
    private List<FieldConfig> fields;
    private List<ActionConfig> actions;

    private String status;
    private String createdBy;
    private String createdTime;
    private String updatedTime;

    @Data
    public static class TreeConfig {
        private Boolean enabled;
        private String expandColumnKey;
        private String childrenColumnName;
        private Integer levelIndent;
    }

    @Data
    public static class FieldConfig {
        private String fieldKey;
        private String fieldLabel;
        private String fieldType;
        private Integer width;
        private String fixed;
        private Boolean isFilter;
        private Boolean sortable;
        private List<Map<String, Object>> options;
        private Boolean isStatusTag;
        private List<Map<String, Object>> statusMap;
        private Boolean isAction;
        private String dbColumn;
        private String dbType;
        private Integer dbLength;
        private String componentPropsJson;
        private Integer sortOrder;
        private DataSource dataSource;
        private Integer dataSourceCacheTtl;
    }

    @Data
    public static class DataSource {
        private String kind;
        // static
        private List<Map<String, Object>> options;
        // tableRef
        private String table;
        private String labelKey;
        private String valueKey;
        private String filterExpr;
        private String apiPath;
        private String cascadeFrom;
        // dict
        private String dictKey;
        // params (api)
        private Map<String, String> params;
    }

    @Data
    public static class ActionConfig {
        private String actionKey;
        private String actionLabel;
        private String actionType;
        private Boolean needConfirm;
        private String conditionExpr;
        private Integer sortOrder;
    }
}
