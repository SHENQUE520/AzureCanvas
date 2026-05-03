package org.neonangellock.azurecanvas.exception;

import lombok.Getter;

@Getter
public class DuplicateUserFieldException extends RuntimeException {
    private final String field;

    public DuplicateUserFieldException(String field, String message) {
        super(message);
        this.field = field;
    }
}
