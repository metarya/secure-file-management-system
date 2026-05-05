package com.project.filemanagement.service;

import com.project.filemanagement.dto.LoginRequest;
import com.project.filemanagement.dto.RegisterRequest;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public String registerUser(RegisterRequest request) {

        if (request.getFullName() == null || request.getFullName().isBlank()) {
            return "Full name is required";
        }

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return "Email is required";
        }

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return "Password is required";
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return "Email already exists";
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(hashedPassword);

        userRepository.save(user);

        return "User registered successfully";
    }

    public String loginUser(LoginRequest request) {

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return "Email is required";
        }

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return "Password is required";
        }

        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());

        if (userOptional.isEmpty()) {
            return "Invalid email or password";
        }

        User user = userOptional.get();

        boolean passwordMatched = passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash()
        );

        if (passwordMatched) {
            return "Login successful";
        }

        return "Invalid email or password";
    }
}
