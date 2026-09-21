package com.runout.shared;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

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

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<ProblemDetail> responseStatusError(ResponseStatusException error) {
        var problem = ProblemDetail.forStatusAndDetail(error.getStatusCode(), error.getReason());
        problem.setTitle("Request failed");
        problem.setProperty("timestamp", Instant.now());
        return ResponseEntity.status(error.getStatusCode()).body(problem);
    }

}
