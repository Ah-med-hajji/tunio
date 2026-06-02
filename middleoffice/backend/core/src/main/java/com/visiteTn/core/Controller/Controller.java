package com.visiteTn.core.Controller;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class Controller {

    @GetMapping
    public ResponseEntity<String> hello() {
        return ResponseEntity.ok("Hello!");
    }

    @GetMapping("/user")
    @PreAuthorize("hasAuthority('ROLE_role_user')")
    public ResponseEntity<String> helloUser() {
        return ResponseEntity.ok("Hello From User!");
    }

    @GetMapping("/admin")
    @PreAuthorize("hasAuthority('ROLE_role_admin')")
    public ResponseEntity<String> helloAdmin() {
        return ResponseEntity.ok("Hello From Admin!");
    }
}
