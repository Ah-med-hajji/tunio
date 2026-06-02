package com.visiteTn.core.Controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/api/admin/test")
    public String adminTest() {
        return "Hello ADMIN!";
    }

    @GetMapping("/api/user/test")
    public String userTest() {
        return "Hello USER or ADMIN!";
    }
}
