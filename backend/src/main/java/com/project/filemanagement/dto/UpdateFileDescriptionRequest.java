package com.project.filemanagement.dto;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateFileDescriptionRequest {

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;
}