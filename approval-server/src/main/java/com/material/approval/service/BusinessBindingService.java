package com.material.approval.service;

import com.material.approval.common.BizException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.sql.Timestamp;
import java.util.List;
import java.util.Map;

/**
 * 业务流程绑定（审批绑定管理）：
 * 维护 business_type → 流程 key 的显式映射与审批模式，业务提交时据此判定三态。
 */
@Service
public class BusinessBindingService {

    /** 行为矩阵：未绑定/停用时 required 报错，optional 直通（由 ApprovalService 判定，这里只管 CRUD 与查询） */
    public record BindingRow(Long id, String businessType, String businessName, String processKey,
                             String approvalMode, boolean enabled, String remark, Timestamp updateTime) {
    }

    private static final RowMapper<BindingRow> MAPPER = (rs, i) -> new BindingRow(
            rs.getLong("id"), rs.getString("business_type"), rs.getString("business_name"),
            rs.getString("process_key"), rs.getString("approval_mode"), rs.getInt("enabled") == 1,
            rs.getString("remark"), rs.getTimestamp("update_time"));

    private final JdbcTemplate jdbcTemplate;

    public BusinessBindingService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<BindingRow> list(String keyword) {
        if (StringUtils.hasText(keyword)) {
            String like = "%" + keyword.trim() + "%";
            return jdbcTemplate.query(
                    "select * from appr_business_binding where business_type like ? or business_name like ? "
                            + "order by id asc", MAPPER, like, like);
        }
        return jdbcTemplate.query("select * from appr_business_binding order by id asc", MAPPER);
    }

    public BindingRow getByType(String businessType) {
        List<BindingRow> rows = jdbcTemplate.query(
                "select * from appr_business_binding where business_type = ?", MAPPER, businessType);
        return rows.isEmpty() ? null : rows.get(0);
    }

    /** 保存（新增或按 business_type 覆盖更新）。businessType 必须已注册回调处理器（白名单）。 */
    @Transactional
    public BindingRow save(Map<String, Object> body) {
        String businessType = trimToNull((String) body.get("businessType"));
        String businessName = trimToNull((String) body.get("businessName"));
        String processKey = trimToNull((String) body.get("processKey"));
        String approvalMode = trimToNull((String) body.get("approvalMode"));
        Boolean enabled = body.get("enabled") == null ? Boolean.TRUE : (Boolean) body.get("enabled");
        String remark = trimToNull((String) body.get("remark"));

        if (businessType == null) {
            throw new BizException(400, "业务类型不能为空");
        }
        if (businessName == null) {
            throw new BizException(400, "业务名称不能为空");
        }
        if (!"required".equals(approvalMode) && !"optional".equals(approvalMode)) {
            throw new BizException(400, "审批模式只能是 required 或 optional");
        }
        if (processKey != null && !processKey.matches("[a-zA-Z][a-zA-Z0-9_]*")) {
            throw new BizException(400, "流程标识必须以字母开头，只能包含字母、数字、下划线");
        }

        BindingRow existing = getByType(businessType);
        if (existing == null) {
            jdbcTemplate.update(
                    "insert into appr_business_binding(business_type, business_name, process_key, approval_mode, "
                            + "enabled, remark) values (?,?,?,?,?,?)",
                    businessType, businessName, processKey, approvalMode, enabled ? 1 : 0, remark);
        } else {
            jdbcTemplate.update(
                    "update appr_business_binding set business_name = ?, process_key = ?, approval_mode = ?, "
                            + "enabled = ?, remark = ? where id = ?",
                    businessName, processKey, approvalMode, enabled ? 1 : 0, remark, existing.id());
        }
        return getByType(businessType);
    }

    @Transactional
    public void updateEnabled(Long id, boolean enabled) {
        int updated = jdbcTemplate.update(
                "update appr_business_binding set enabled = ? where id = ?", enabled ? 1 : 0, id);
        if (updated == 0) {
            throw new BizException(404, "绑定记录不存在");
        }
    }

    private static String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
