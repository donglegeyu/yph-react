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

    /**
     * 详情页关联的列表页 pageKey（仅 templateType='detail' 时使用）
     * 列表页与详情页共用同一个 schema_json 存储模型，此字段用于运行时从列表页取数据
     */
    private String sourceListPageKey;

    private TreeConfig treeConfig;
    private List<FieldConfig> fields;
    private List<ActionConfig> actions;
    private List<ToolbarButtonConfig> toolbarButtons;

    private DetailHeaderConfig detailHeader;

    /** 表单页模板配置（footerButtons 为空数组时不渲染底部操作区） */
    private FormPageConfig formConfig;

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
        /** 表单页字段所属分组 id（对应 formConfig.fieldGroups） */
        private String groupId;
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

    @Data
    public static class ToolbarButtonConfig {
        private String btnKey;
        private String btnLabel;
        private String btnType;
        private String tooltip;
        private Integer sortOrder;
    }

    @Data
    public static class DetailHeaderConfig {
        private String primaryNameFieldKey;
        private Boolean showAvatar;
        private List<DetailTagConfig> tags;
        private List<DetailTabConfig> tabs;
        private List<ToolbarButtonConfig> titleActions;
    }

    @Data
    public static class DetailTagConfig {
        private String tagKey;
        private String tagText;
        private String variant;
        private Integer sortOrder;
    }

    @Data
    public static class DetailTabConfig {
        private String tabKey;
        private String tabLabel;
        private Integer sortOrder;
        private String contentType;
        private List<String> fieldKeys;
        private Integer fieldColumns;
        // contentType=fields 分组模式：按分组渲染（Tab → Groups → Fields）
        private List<DetailFieldGroupConfig> fieldGroups;
        private List<SubTableColumnConfig> subTableColumns;
        private String subTableTitle;
        private List<TimelineItemConfig> timelineItems;
    }

    @Data
    public static class DetailFieldGroupConfig {
        private String groupKey;
        private String groupLabel;
        private List<String> fieldKeys;
        private Integer sortOrder;
    }

    @Data
    public static class SubTableColumnConfig {
        private String colKey;
        private String colLabel;
        private Integer sortOrder;
    }

    @Data
    public static class TimelineItemConfig {
        private String time;
        private String content;
        private Integer sortOrder;
    }

    @Data
    public static class FormPageConfig {
        private List<FooterButtonConfig> footerButtons;
        /** 表单页字段分组（一等结构）：字段通过 FieldConfig.groupId 归属 */
        private List<FormFieldGroupConfig> fieldGroups;
    }

    @Data
    public static class FormFieldGroupConfig {
        private String id;
        private String name;
    }

    @Data
    public static class FooterButtonConfig {
        private String btnKey;
        private String btnLabel;
        private String btnType;
        private String action;
        private Integer sortOrder;
    }
}
