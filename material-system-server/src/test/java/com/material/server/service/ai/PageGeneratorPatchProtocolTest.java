package com.material.server.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 补丁协议解析/校验的纯单元测试（不连网关、不连数据库）。
 */
class PageGeneratorPatchProtocolTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void markerContentIsBufferedAndNotLeaked() {
        PagePatchStreamFilter filter = new PagePatchStreamFilter();
        StringBuilder visible = new StringBuilder();
        visible.append(filter.accept("我先说明一下<!--page_pa"));
        visible.append(filter.accept("tch-->{\"pageName\":\"入库单列表\",\"fields\":[{\"fieldLabel\":\"入库单号\","
                + "\"fieldKey\":\"stockNo\",\"fieldType\":\"input\"}]}<!--/page_pa"));
        visible.append(filter.accept("tch-->完成"));
        visible.append(filter.finish());

        assertEquals("我先说明一下完成", visible.toString());
        assertTrue(filter.hasPatch());
        assertEquals("{\"pageName\":\"入库单列表\",\"fields\":[{\"fieldLabel\":\"入库单号\","
                + "\"fieldKey\":\"stockNo\",\"fieldType\":\"input\"}]}", filter.patchJson());
        assertFalse(filter.unclosed());
    }

    @Test
    void unclosedMarkerIsRejected() {
        PagePatchStreamFilter filter = new PagePatchStreamFilter();
        assertEquals("前缀", filter.accept("前缀<!--page_patch-->{\"pageName\":\"x\""));
        assertEquals("", filter.finish());
        assertTrue(filter.unclosed());
        assertTrue(filter.hasPatch());
    }

    @Test
    void validPatchPassesWhitelist() throws Exception {
        JsonNode patch = objectMapper.readTree("""
                {
                  "pageName": "入库单列表",
                  "templateType": "list_basic",
                  "menuLinkMode": "new_child",
                  "generateMenu": true,
                  "fields": [
                    {"fieldLabel": "入库单号", "fieldKey": "stockNo", "fieldType": "input",
                     "width": 160, "fixed": "left", "isFilter": true, "dbColumn": "stock_no",
                     "dbType": "varchar", "dbLength": 64}
                  ]
                }
                """);
        PageGeneratorPatchProtocol.PatchValidation result = PageGeneratorPatchProtocol.validate(patch);
        assertTrue(result.ok());
        assertNotNull(result.patch());
        assertEquals("VARCHAR", result.patch().path("fields").path(0).path("dbType").asText());
        assertTrue(result.errors().isEmpty());
    }

    @Test
    void publishInstructionIsRejected() throws Exception {
        JsonNode patch = objectMapper.readTree("{\"pageName\":\"x\",\"publish\":true}");
        PageGeneratorPatchProtocol.PatchValidation result = PageGeneratorPatchProtocol.validate(patch);
        assertFalse(result.ok());
        assertTrue(result.errors().get(0).contains("不能执行发布"));
    }

    @Test
    void unknownTopLevelKeyIsRejected() throws Exception {
        JsonNode patch = objectMapper.readTree("{\"pageName\":\"x\",\"foo\":1}");
        PageGeneratorPatchProtocol.PatchValidation result = PageGeneratorPatchProtocol.validate(patch);
        assertFalse(result.ok());
        assertTrue(result.errors().get(0).contains("foo"));
    }

    @Test
    void duplicateFieldKeyIsRejected() throws Exception {
        JsonNode patch = objectMapper.readTree("""
                {"pageName":"x","fields":[
                  {"fieldLabel":"甲","fieldKey":"dup"},
                  {"fieldLabel":"乙","fieldKey":"dup"}
                ]}
                """);
        PageGeneratorPatchProtocol.PatchValidation result = PageGeneratorPatchProtocol.validate(patch);
        assertFalse(result.ok());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("重复")));
    }

    @Test
    void invalidFieldTypeIsRejected() throws Exception {
        JsonNode patch = objectMapper.readTree("""
                {"pageName":"x","fields":[{"fieldLabel":"甲","fieldKey":"a","fieldType":"unknown"}]}
                """);
        PageGeneratorPatchProtocol.PatchValidation result = PageGeneratorPatchProtocol.validate(patch);
        assertFalse(result.ok());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("fieldType")));
    }

    @Test
    void actionColumnKeyIsRejected() throws Exception {
        JsonNode patch = objectMapper.readTree("""
                {"pageName":"x","fields":[{"fieldLabel":"甲","fieldKey":"a","isAction":true}]}
                """);
        PageGeneratorPatchProtocol.PatchValidation result = PageGeneratorPatchProtocol.validate(patch);
        assertFalse(result.ok());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("isAction")));
    }

    @Test
    void contextDigestUsesCompactFieldLines() throws Exception {
        ObjectNode context = objectMapper.createObjectNode();
        ObjectNode values = context.putObject("values");
        values.put("mode", "default");
        values.put("pageName", "入库单列表");
        values.put("fieldCount", 1);
        var fields = values.putArray("fields");
        ObjectNode field = fields.addObject();
        field.put("fieldLabel", "入库单号");
        field.put("fieldKey", "stockNo");
        field.put("fieldType", "input");

        String prompt = PageGeneratorPatchProtocol.buildSystemPrompt(context);
        assertTrue(prompt.contains("已有字段"));
        assertTrue(prompt.contains("stockNo"));
        assertTrue(prompt.contains(PageGeneratorPatchProtocol.START_MARKER));
        assertTrue(prompt.contains(PageGeneratorPatchProtocol.END_MARKER));
        // 不再整段灌 JSON：字段以「中文名(key)[类型]」压缩展示
        assertTrue(prompt.contains("入库单号(stockNo)[input]"));
        // 创建意图但未给字段时，要求模型自行推断并直接出补丁，避免只反问
        assertTrue(prompt.contains("直接输出补丁"), "提示词应要求创建意图下直接产出补丁");
    }

    @Test
    void stringOptionsAreNormalized() throws Exception {
        ObjectNode patch = objectMapper.createObjectNode();
        patch.put("pageName", "施工申请列表");
        ObjectNode field = patch.putArray("fields").addObject();
        field.put("fieldLabel", "审批状态");
        field.put("fieldKey", "approvalStatus");
        field.put("fieldType", "select");
        ArrayNode options = field.putArray("options");
        options.add("待审批");
        options.add("已通过");

        PageGeneratorPatchProtocol.PatchValidation result = PageGeneratorPatchProtocol.validate(patch);
        assertTrue(result.ok(), () -> "字符串数组形式的 options 应被规范化而不是拒绝：" + result.errors());
        JsonNode normalized = result.patch().path("fields").path(0).path("options");
        assertEquals(2, normalized.size());
        assertTrue(normalized.get(0).isObject());
        assertEquals("待审批", normalized.get(0).path("label").asText());
        assertEquals("待审批", normalized.get(0).path("value").asText());
    }

    @Test
    void actionItemsSummarizePatch() throws Exception {
        JsonNode patch = objectMapper.readTree("""
                {"pageName":"入库单列表","templateType":"list_basic","menuLinkMode":"new_child",
                 "fields":[{"fieldLabel":"入库单号","fieldKey":"stockNo","isFilter":true}]}
                """);
        assertEquals("入库单列表 · 草稿补丁", PageGeneratorPatchProtocol.buildActionTitle(patch));
        assertTrue(PageGeneratorPatchProtocol.buildActionItems(patch).contains("页面名称：入库单列表"));
    }

    @Test
    void menuIdAcceptsNumberAndNull() throws Exception {
        JsonNode patch = objectMapper.readTree("{\"pageName\":\"x\",\"parentMenuId\":12,\"bindMenuId\":null}");
        PageGeneratorPatchProtocol.PatchValidation result = PageGeneratorPatchProtocol.validate(patch);
        assertTrue(result.ok(), String.valueOf(result.errors()));
        assertEquals("12", result.patch().path("parentMenuId").asText());
        assertTrue(result.patch().path("bindMenuId").isNull());
    }
}
