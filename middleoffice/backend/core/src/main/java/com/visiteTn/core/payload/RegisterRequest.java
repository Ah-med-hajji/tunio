package com.visiteTn.core.payload;


import lombok.Data;

@Data
public class RegisterRequest {
    private String usernameOrEmail;
    private String firstName;
    private String lastName;
    private String password;
    private String role;
}

