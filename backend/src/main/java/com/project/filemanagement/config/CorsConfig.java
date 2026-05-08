package com.project.filemanagement.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {

        return new WebMvcConfigurer() {

            @Override
            public void addCorsMappings(@NonNull CorsRegistry registry) {

                registry.addMapping("/api/**")
                        .allowedOriginPatterns(
                                "http://localhost:5173",
                                "http://127.0.0.1:5173",
                                "https://secure-file-management-system.netlify.app",
                                "https://*.netlify.app"
                        )
                        .allowedMethods(
                                "GET",
                                "POST",
                                "PUT",
                                "PATCH",
                                "DELETE",
                                "OPTIONS"
                        )
                        .allowedHeaders(
                                "Authorization",
                                "Content-Type",
                                "Accept",
                                "Origin",
                                "X-Requested-With",
                                "ngrok-skip-browser-warning"
                        )
                        .exposedHeaders(
                                "Content-Disposition"
                        )
                        .allowCredentials(true)
                        .maxAge(3600);
            }
        };
    }
}