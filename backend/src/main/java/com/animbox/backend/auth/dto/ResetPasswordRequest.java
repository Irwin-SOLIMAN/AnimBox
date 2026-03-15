package com.animbox.backend.auth.dto;

public record ResetPasswordRequest(String token, String newPassword) {}
