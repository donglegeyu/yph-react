package com.material.approval.service;

import com.material.approval.dto.StartInternalRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 提交失败日志（appr_submit_fail_log）。
 * startInternal 失败时以 REQUIRES_NEW 独立事务落库：主事务回滚不影响失败记录留存，
 * 待办任务页「提交失败」统计卡按 status='failed' 口径计数。
 */
@Service
public class SubmitFailLogService {

    private static final Logger log = LoggerFactory.getLogger(SubmitFailLogService.class);

    private final JdbcTemplate jdbcTemplate;

    public SubmitFailLogService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** 独立事务写失败日志：任何异常仅记日志，绝不影响主流程的异常抛出 */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFail(StartInternalRequest request, String reason) {
        try {
            String safeReason = reason == null ? null : reason.substring(0, Math.min(reason.length(), 1000));
            jdbcTemplate.update(
                    "insert into appr_submit_fail_log "
                            + "(business_type, business_id, business_no, title, applicant_id, applicant_name, fail_reason, status) "
                            + "values (?, ?, ?, ?, ?, ?, ?, 'failed')",
                    request == null ? null : request.businessType(),
                    request == null ? null : request.businessId(),
                    request == null ? null : request.businessNo(),
                    request == null ? null : request.title(),
                    request == null ? null : request.applicantId(),
                    request == null ? null : request.applicantName(),
                    safeReason);
        } catch (Exception e) {
            log.error("提交失败日志落库异常 businessType={}",
                    request == null ? null : request.businessType(), e);
        }
    }
}
