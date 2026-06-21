package com.material.server.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.material.server.entity.CraftsmanCertificate;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface CraftsmanCertificateMapper extends BaseMapper<CraftsmanCertificate> {

    @Delete("DELETE FROM craftsman_certificate WHERE craftsman_id = #{craftsmanId}")
    int physicalDeleteByCraftsmanId(@Param("craftsmanId") Long craftsmanId);
}
