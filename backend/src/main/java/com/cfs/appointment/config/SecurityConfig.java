package com.cfs.appointment.config;

import com.cfs.appointment.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    // 🔐 Authentication Manager (used in login API)
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // 🔐 Authentication Provider
    @Bean
public AuthenticationProvider authenticationProvider() {

    DaoAuthenticationProvider provider =
            new DaoAuthenticationProvider(userService);

    provider.setPasswordEncoder(passwordEncoder); // ✅ FIXED

    return provider;
}

    // 🔐 Security Filter Chain (NO circular dependency here)
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtFilter jwtFilter) throws Exception {

        http
            .cors(org.springframework.security.config.Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())

            // ✅ JWT = Stateless
            .sessionManagement(sess ->
                sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            .authorizeHttpRequests(auth -> auth

                // 🔥 PUBLIC ENDPOINTS
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/test/**").permitAll()
                .requestMatchers("/api/doctors/verified").permitAll()
                .requestMatchers("/api/consultation/ai/**").permitAll()

                // 🔒 ROLE-BASED
                .requestMatchers("/api/appointments/book").hasAuthority("ROLE_PATIENT")
                .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")

                // 🔐 EVERYTHING ELSE
                .anyRequest().authenticated()
            )

            // 🔐 Attach authentication provider
            .authenticationProvider(authenticationProvider())

            // 🔐 Add JWT filter
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}