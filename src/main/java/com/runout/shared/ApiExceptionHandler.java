package com.runout.shared;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;

@RestControllerAdvice
class ApiExceptionHandler {

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    ResponseEntity<ProblemDetail> businessError(RuntimeException error) {
        var problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, error.getMessage());
        problem.setTitle("Business rule violation");
        problem.setProperty("timestamp", Instant.now());
        return ResponseEntity.unprocessableEntity().body(problem);
    }

}
