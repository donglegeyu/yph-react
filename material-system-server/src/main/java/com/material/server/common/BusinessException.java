package com.material.server.common;

public class BusinessException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    private int code;

    public BusinessException(String message) {
        super(message);
        this.code = Result.ERROR_CODE;
    }

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }
}
