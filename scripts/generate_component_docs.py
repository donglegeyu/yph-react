#!/usr/bin/env python3
"""
从 Vue 组件生成组件文档索引
"""

import json
import sys
from pathlib import Path
from typing import Dict, List


def scan_components(component_dir: str) -> List[Dict]:
    """扫描组件目录"""
    components = []

    for vue_file in Path(component_dir).rglob('*.vue'):
        component_info = {
            'name': vue_file.stem,
            'path': str(vue_file.relative_to(component_dir)),
            'type': 'layout' if 'layout' in str(vue_file) else 'common'
        }

        # 读取文件内容
        with open(vue_file, 'r', encoding='utf-8') as f:
            content = f.read()

            # 提取描述
            if '<template>' in content:
                component_info['has_template'] = True

            if '<script' in content:
                component_info['has_script'] = True

            if '<style' in content:
                component_info['has_style'] = True

        components.append(component_info)

    return components


def generate_component_json(component_dir: str, output_path: str):
    """生成组件文档 JSON"""

    components = scan_components(component_dir)

    output = {
        'generated_at': str(Path(output_path).stat().st_mtime if Path(output_path).exists() else 0),
        'total': len(components),
        'components': components
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"✅ 组件文档已生成: {output_path}")


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='生成组件文档索引')
    parser.add_argument('--input', required=True, help='组件目录路径')
    parser.add_argument('--output', required=True, help='输出 JSON 文件路径')

    args = parser.parse_args()

    generate_component_json(args.input, args.output)
