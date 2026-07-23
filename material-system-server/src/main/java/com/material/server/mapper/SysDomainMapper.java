package com.material.server.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.material.server.entity.SysDomain;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface SysDomainMapper extends BaseMapper<SysDomain> {

    @Select("SELECT * FROM sys_domain WHERE domain_key = #{domainKey} LIMIT 1")
    SysDomain selectByDomainKeyIgnoreDeleted(@Param("domainKey") String domainKey);
}
