package com.material.approval.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.material.approval.common.BizException;
import com.material.approval.dto.ProcessDesignVO;
import com.material.approval.dto.PublishResultVO;
import com.material.approval.dto.SaveDesignRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.flowable.common.engine.api.FlowableException;
import org.flowable.engine.RepositoryService;
import org.flowable.engine.repository.Deployment;
import org.flowable.engine.repository.ProcessDefinition;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/** 宜搭式流程设计器：设计 JSON 草稿 CRUD + 发布（JSON→BPMN 部署） */
@Service
public class ProcessDesignService {

    private static final RowMapper<ProcessDesignVO> FULL_MAPPER = (rs, i) -> new ProcessDesignVO(
            rs.getLong("id"), rs.getString("process_key"), rs.getString("name"),
            rs.getString("design_json"), rs.getInt("published_version"),
            toLocal(rs.getTimestamp("update_time")));

    private static final RowMapper<ProcessDesignVO> LIST_MAPPER = (rs, i) -> new ProcessDesignVO(
            rs.getLong("id"), rs.getString("process_key"), rs.getString("name"),
            null, rs.getInt("published_version"), toLocal(rs.getTimestamp("update_time")));

    private final JdbcTemplate jdbcTemplate;
    private final RepositoryService repositoryService;
    private final ObjectMapper objectMapper;

    public ProcessDesignService(JdbcTemplate jdbcTemplate, RepositoryService repositoryService, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.repositoryService = repositoryService;
        this.objectMapper = objectMapper;
    }

    // ---------------- 草稿 CRUD ----------------

    @Transactional
    public ProcessDesignVO createDraft(String name, String processKey) {
        if (!StringUtils.hasText(name)) {
            throw new BizException(400, "流程名称不能为空");
        }
        String trimmed = name.trim();
        // 流程标识：自定义优先（约定式路由依赖它，如 craftsmanApplication），为空则自动生成
        String key = null;
        if (StringUtils.hasText(processKey)) {
            key = processKey.trim();
            if (!key.matches("[a-zA-Z][a-zA-Z0-9_]*")) {
                throw new BizException(400, "流程标识必须以字母开头，只能包含字母、数字、下划线");
            }
            Long count = jdbcTemplate.queryForObject(
                    "select count(*) from appr_process_design where process_key = ?", Long.class, key);
            if (count != null && count > 0) {
                throw new BizException(400, "流程标识已存在：" + key);
            }
            jdbcTemplate.update("insert into appr_process_design(process_key, name, design_json) values (?,?,?)",
                    key, trimmed, initialJson(trimmed));
        }
        String generated = null;
        for (int attempt = 0; attempt < 3 && StringUtils.hasText(processKey) == false; attempt++) {
            String candidate = "proc" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                    + ThreadLocalRandom.current().nextInt(100, 1000);
            try {
                jdbcTemplate.update("insert into appr_process_design(process_key, name, design_json) values (?,?,?)",
                        candidate, trimmed, initialJson(trimmed));
                generated = candidate;
            } catch (DataIntegrityViolationException e) {
                // process_key 唯一冲突，重新生成重试
            }
        }
        String finalKey = StringUtils.hasText(processKey) ? key : generated;
        if (finalKey == null) {
            throw new BizException(500, "生成流程标识失败，请重试");
        }
        return queryById(finalKey);
    }

    public List<ProcessDesignVO> list() {
        return jdbcTemplate.query(
                "select id, process_key, name, published_version, update_time from appr_process_design order by id desc",
                LIST_MAPPER);
    }

    public ProcessDesignVO get(Long id) {
        return queryById(id);
    }

    @Transactional
    public ProcessDesignVO save(Long id, SaveDesignRequest request) {
        ProcessDesignVO existing = queryById(id);
        String name = request == null || !StringUtils.hasText(request.name())
                ? existing.name() : request.name().trim();
        String json = request == null || !StringUtils.hasText(request.designJson())
                ? existing.designJson() : request.designJson();
        jdbcTemplate.update("update appr_process_design set name = ?, design_json = ? where id = ?", name, json, id);
        return queryById(id);
    }

    // ---------------- 发布 ----------------

    @Transactional
    public PublishResultVO publish(Long id) {
        ProcessDesignVO design = queryById(id);
        JsonNode doc;
        try {
            doc = objectMapper.readTree(design.designJson());
        } catch (JsonProcessingException e) {
            throw new BizException(400, "设计数据不是有效的 JSON：" + e.getOriginalMessage());
        }
        String xml = BpmnGenerator.generate(design.processKey(), design.name(), doc);

        Deployment deployment;
        try {
            deployment = repositoryService.createDeployment()
                    .name(design.name())
                    .addString(design.processKey() + ".bpmn20.xml", xml)
                    .deploy();
        } catch (FlowableException e) {
            throw new BizException(400, "流程发布失败：" + e.getMessage());
        }
        ProcessDefinition definition = repositoryService.createProcessDefinitionQuery()
                .deploymentId(deployment.getId()).singleResult();
        if (definition == null) {
            throw new BizException(500, "发布成功但未查询到流程定义");
        }
        jdbcTemplate.update("update appr_process_design set published_version = ? where id = ?",
                definition.getVersion(), id);
        return new PublishResultVO(definition.getId(), definition.getKey(), definition.getName(), definition.getVersion());
    }

    // ---------------- 内部工具 ----------------

    private ProcessDesignVO queryById(Long id) {
        List<ProcessDesignVO> rows = jdbcTemplate.query(
                "select id, process_key, name, design_json, published_version, update_time "
                        + "from appr_process_design where id = ?", FULL_MAPPER, id);
        if (rows.isEmpty()) {
            throw new BizException(404, "流程设计不存在");
        }
        return rows.get(0);
    }

    private ProcessDesignVO queryById(String processKey) {
        List<ProcessDesignVO> rows = jdbcTemplate.query(
                "select id, process_key, name, design_json, published_version, update_time "
                        + "from appr_process_design where process_key = ?", FULL_MAPPER, processKey);
        if (rows.isEmpty()) {
            throw new BizException(404, "流程设计不存在");
        }
        return rows.get(0);
    }

    /** 新草稿初始文档：发起人 → 结束 */
    private String initialJson(String name) {
        ObjectNode doc = objectMapper.createObjectNode();
        doc.put("name", name);
        ArrayNode nodes = doc.putArray("nodes");
        ObjectNode start = nodes.addObject();
        start.put("id", "start");
        start.put("type", "start");
        start.put("name", "发起人");
        ObjectNode end = nodes.addObject();
        end.put("id", "end");
        end.put("type", "end");
        end.put("name", "结束");
        return doc.toString();
    }

    private static LocalDateTime toLocal(java.sql.Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }
}
