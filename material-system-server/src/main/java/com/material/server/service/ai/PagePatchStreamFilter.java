package com.material.server.service.ai;

/**
 * 流式标记过滤器：
 * 只把标记区间外的文本返回给调用方（用于 delta 帧），标记区间内的 JSON 缓冲起来，
 * 流结束后由 {@link #patchJson()} 取出解析。跨 chunk 的标记片段会被暂存，避免外泄。
 */
public final class PagePatchStreamFilter {

    /** 输入缓冲：跨 chunk 未决内容 */
    private final StringBuilder input = new StringBuilder();
    /** 已缓冲的补丁 JSON */
    private final StringBuilder patch = new StringBuilder();
    /** 是否处于补丁区间 */
    private boolean inPatch;
    /** 是否见过开始标记 */
    private boolean sawStart;
    /** 标记是否未闭合 */
    private boolean unclosed;

    /**
     * 接收一段模型输出，返回可以立即下发的可见文本（可能为空）。
     */
    public String accept(String chunk) {
        if (chunk == null || chunk.isEmpty()) {
            return "";
        }
        input.append(chunk);
        StringBuilder visible = new StringBuilder();
        drain(visible);
        return visible.toString();
    }

    private void drain(StringBuilder visible) {
        while (true) {
            if (!inPatch) {
                int start = input.indexOf(PageGeneratorPatchProtocol.START_MARKER);
                if (start >= 0) {
                    visible.append(input, 0, start);
                    input.delete(0, start + PageGeneratorPatchProtocol.START_MARKER.length());
                    inPatch = true;
                    sawStart = true;
                    continue;
                }
                // 末尾可能是标记前缀（如 "<!--page_pa"），暂存不下发
                int hold = longestSuffixPrefix(input.toString(), PageGeneratorPatchProtocol.START_MARKER);
                int emitLen = input.length() - hold;
                if (emitLen > 0) {
                    visible.append(input, 0, emitLen);
                    input.delete(0, emitLen);
                }
                return;
            }

            int end = input.indexOf(PageGeneratorPatchProtocol.END_MARKER);
            if (end >= 0) {
                patch.append(input, 0, end);
                input.delete(0, end + PageGeneratorPatchProtocol.END_MARKER.length());
                inPatch = false;
                continue;
            }
            int hold = longestSuffixPrefix(input.toString(), PageGeneratorPatchProtocol.END_MARKER);
            int appendLen = input.length() - hold;
            if (appendLen > 0) {
                patch.append(input, 0, appendLen);
                input.delete(0, appendLen);
            }
            return;
        }
    }

    /**
     * 流结束：返回尚未下发的可见文本；未闭合的标记内容不返回。
     */
    public String finish() {
        StringBuilder visible = new StringBuilder();
        if (inPatch) {
            patch.append(input);
            input.setLength(0);
            unclosed = true;
            return "";
        }
        String tail = input.toString();
        // 模型输出被截断在标记前缀处：丢弃，避免把标记片段当正文展示
        if (!tail.isEmpty() && PageGeneratorPatchProtocol.START_MARKER.startsWith(tail)) {
            input.setLength(0);
            unclosed = true;
            return "";
        }
        visible.append(tail);
        input.setLength(0);
        return visible.toString();
    }

    public boolean sawStart() {
        return sawStart;
    }

    public boolean unclosed() {
        return unclosed;
    }

    public boolean hasPatch() {
        return !patch.toString().isBlank();
    }

    public String patchJson() {
        return patch.toString().trim();
    }

    private static int longestSuffixPrefix(String source, String marker) {
        int max = Math.min(source.length(), marker.length() - 1);
        for (int k = max; k > 0; k--) {
            if (source.regionMatches(source.length() - k, marker, 0, k)) {
                return k;
            }
        }
        return 0;
    }
}
