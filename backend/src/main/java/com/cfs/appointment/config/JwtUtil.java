package com.cfs.appointment.config;
import java.util.Date;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
@Component
public class JwtUtil {

    private final SecretKey key = Keys.hmacShaKeyFor(
            "my-secret-key-my-secret-key-my-secret-key".getBytes()
    );

    public String generateToken(UserDetails userDetails) {
    return Jwts.builder()
            .setSubject(userDetails.getUsername())
            .claim("roles", userDetails.getAuthorities())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60))
            .signWith(key) // ✅ no algorithm needed explicitly
            .compact();
        }

    public String extractUsername(String token) {
    return Jwts.parserBuilder()   // ✅ NOT parser()
            .setSigningKey(key)   // key = SecretKey
            .build()
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }
    public boolean validateToken(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername());
    }
}