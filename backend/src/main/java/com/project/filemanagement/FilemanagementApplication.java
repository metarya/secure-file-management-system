package com.project.filemanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

// Temporary for Slot 1 only.
// This prevents Spring Boot from trying to connect to MySQL before database setup.
@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class FilemanagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(FilemanagementApplication.class, args);
    }
}
