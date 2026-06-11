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

    public void sendOtpEmail(String toEmail, String otp) {

        try {

            SimpleMailMessage message = new SimpleMailMessage();

            message.setFrom("metaryajain07@gmail.com");

            message.setTo(toEmail);

            message.setSubject("Password Reset OTP");

            message.setText(
                    """
                    Secure File Management System

                    Your password reset OTP is:

                    %s

                    This OTP is valid for 5 minutes.

                    If you did not request a password reset, please ignore this email.
                    """.formatted(otp)
            );

            mailSender.send(message);

            System.out.println("OTP EMAIL SENT SUCCESSFULLY");

        } catch (MailException exception) {

            throw new RuntimeException(
                    "Failed to send OTP email"
            );
        }
    }
}