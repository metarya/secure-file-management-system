package com.project.filemanagement.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendResetPasswordEmail(String toEmail, String resetCode) {

    try {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom("metaryajain07@gmail.com");

        message.setTo(toEmail);

        message.setSubject("Reset Your Password");

        message.setText(
                "Password Reset Code:\n\n"
                        + resetCode
        );

        mailSender.send(message);

        System.out.println("EMAIL SENT SUCCESSFULLY");

        } catch (MailException exception) {

            throw new RuntimeException(
                    "Failed to send reset password email"
            );
        }
    }
}
