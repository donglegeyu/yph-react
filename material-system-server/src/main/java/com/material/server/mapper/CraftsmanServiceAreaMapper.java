package com.material.server.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.material.server.entity.CraftsmanServiceArea;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface CraftsmanServiceAreaMapper extends BaseMapper<CraftsmanServiceArea> {

    @Delete("DELETE FROM craftsman_service_area WHERE craftsman_id = #{craftsmanId}")
    int physicalDeleteByCraftsmanId(@Param("craftsmanId") Long craftsmanId);
}
