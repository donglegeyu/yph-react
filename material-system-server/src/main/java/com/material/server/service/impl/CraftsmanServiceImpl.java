package com.material.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.material.server.dto.CraftsmanCreateDTO;
import com.material.server.entity.Craftsman;
import com.material.server.entity.CraftsmanBrand;
import com.material.server.entity.CraftsmanCertificate;
import com.material.server.entity.CraftsmanServiceArea;
import com.material.server.entity.CraftsmanSkill;
import com.material.server.mapper.CraftsmanBrandMapper;
import com.material.server.mapper.CraftsmanCertificateMapper;
import com.material.server.mapper.CraftsmanMapper;
import com.material.server.mapper.CraftsmanServiceAreaMapper;
import com.material.server.mapper.CraftsmanSkillMapper;
import com.material.server.service.CraftsmanService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CraftsmanServiceImpl
    extends ServiceImpl<CraftsmanMapper, Craftsman>
    implements CraftsmanService {

    private final CraftsmanSkillMapper craftsmanSkillMapper;
    private final CraftsmanBrandMapper craftsmanBrandMapper;
    private final CraftsmanServiceAreaMapper craftsmanServiceAreaMapper;
    private final CraftsmanCertificateMapper craftsmanCertificateMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createCraftsman(CraftsmanCreateDTO dto) {
        Craftsman craftsman = buildCraftsmanFromDto(dto);
        save(craftsman);
        Long craftsmanId = craftsman.getId();

        saveSkills(craftsmanId, dto.getServiceSkillIds());
        saveBrands(craftsmanId, dto.getBrands());
        saveServiceAreas(craftsmanId, dto.getServiceAreas(), dto.getServiceAreaLabels());
        saveCertificates(craftsmanId, dto.getCertificates());

        return craftsmanId;
    }

    private Craftsman buildCraftsmanFromDto(CraftsmanCreateDTO dto) {
        Craftsman c = new Craftsman();
        c.setCraftsmanCode(generateCraftsmanCode());
        c.setName(dto.getName());
        c.setPhone(dto.getPhone());
        c.setUserAccount(dto.getUserAccount());
        c.setCraftsmanCategory(dto.getCraftsmanCategory());
        c.setCraftsmanType(dto.getCraftsmanType());
        c.setServiceProviderName(dto.getServiceProviderName());
        c.setRegion(dto.getRegion());
        c.setIdCardNo(dto.getIdCardNo());
        c.setIdCardImages(joinNonEmpty(dto.getIdCardFrontUrl(), dto.getIdCardBackUrl()));

        c.setResidentialAddress(buildResidentialAddress(dto));
        c.setServiceSkills(dto.getServiceSkillIds() == null ? "" :
                dto.getServiceSkillIds().stream().map(String::valueOf).collect(Collectors.joining(",")));

        String areaStr = dto.getServiceAreas() == null ? "" : String.join(";", dto.getServiceAreas());
        c.setServiceArea(areaStr);

        c.setWorkCertificate(joinList(dto.getWorkCertificate()));
        c.setNoCriminalCertificate(joinList(dto.getNoCriminalCertificate()));

        c.setRegisterTime(LocalDateTime.now());
        c.setStatus(1);
        return c;
    }

    private String buildResidentialAddress(CraftsmanCreateDTO dto) {
        List<String> parts = new ArrayList<>();
        if (dto.getResidentialArea() != null) {
            dto.getResidentialArea().forEach(p -> { if (p != null && !p.toString().isEmpty()) parts.add(p.toString()); });
        }
        if (dto.getResidentialStreet() != null && !dto.getResidentialStreet().isEmpty()) {
            parts.add(dto.getResidentialStreet());
        }
        if (dto.getResidentialDetail() != null && !dto.getResidentialDetail().isEmpty()) {
            parts.add(dto.getResidentialDetail());
        }
        return String.join("", parts);
    }

    private void saveSkills(Long craftsmanId, List<Long> skillIds) {
        if (skillIds == null || skillIds.isEmpty()) return;
        for (Long skillId : skillIds) {
            CraftsmanSkill cs = new CraftsmanSkill();
            cs.setCraftsmanId(craftsmanId);
            cs.setSkillId(skillId);
            craftsmanSkillMapper.insert(cs);
        }
    }

    private void saveBrands(Long craftsmanId, List<String> brands) {
        if (brands == null || brands.isEmpty()) return;
        for (String brand : brands) {
            CraftsmanBrand cb = new CraftsmanBrand();
            cb.setCraftsmanId(craftsmanId);
            cb.setBrandValue(brand);
            craftsmanBrandMapper.insert(cb);
        }
    }

    private void saveServiceAreas(Long craftsmanId, List<String> areas, List<String> labels) {
        if (areas == null || areas.isEmpty()) return;
        for (int i = 0; i < areas.size(); i++) {
            CraftsmanServiceArea csa = new CraftsmanServiceArea();
            csa.setCraftsmanId(craftsmanId);
            csa.setAreaCodes(areas.get(i));
            csa.setAreaLabels(labels != null && i < labels.size() ? labels.get(i) : null);
            craftsmanServiceAreaMapper.insert(csa);
        }
    }

    private void saveCertificates(Long craftsmanId, Map<String, String> certificates) {
        if (certificates == null || certificates.isEmpty()) return;
        certificates.forEach((type, urls) -> {
            if (urls == null || urls.isEmpty()) return;
            CraftsmanCertificate cc = new CraftsmanCertificate();
            cc.setCraftsmanId(craftsmanId);
            cc.setCertificateType(type);
            cc.setImageUrls(urls);
            craftsmanCertificateMapper.insert(cc);
        });
    }

    private String joinList(List<String> list) {
        if (list == null || list.isEmpty()) return "";
        return String.join(",", list);
    }

    private String joinNonEmpty(String... vals) {
        List<String> parts = new ArrayList<>();
        for (String v : vals) {
            if (v != null && !v.isEmpty()) parts.add(v);
        }
        return String.join(",", parts);
    }

    private String generateCraftsmanCode() {
        int year = java.time.Year.now().getValue();
        LambdaQueryWrapper<Craftsman> query = new LambdaQueryWrapper<>();
        query.likeRight(Craftsman::getCraftsmanCode, "CM" + year).orderByDesc(Craftsman::getCraftsmanCode).last("LIMIT 1");
        Craftsman latest = getOne(query);
        int nextSeq = 1;
        if (latest != null && latest.getCraftsmanCode() != null) {
            try {
                String seqPart = latest.getCraftsmanCode().substring(("CM" + year).length());
                nextSeq = Integer.parseInt(seqPart) + 1;
            } catch (NumberFormatException ignored) {
            }
        }
        return String.format("CM%d%05d", year, nextSeq);
    }
}
