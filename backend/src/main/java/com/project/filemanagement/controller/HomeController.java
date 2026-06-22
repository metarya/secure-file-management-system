package com.project.filemanagement.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/")
    public String home() {
        return "Secure File Management System Backend is running";
    }

    @GetMapping("/api/test")
    public String testApi() {
        return "API test successful";
    }
}
