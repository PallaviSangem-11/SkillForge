package com.skillforge.config;

import com.skillforge.service.AuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthService authService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);

        // Safely try to extract username from token. If token parsing fails (bad signature, expired),
        // log and continue the filter chain without authenticating so that endpoints that permit anonymous
        // access (like /api/auth/register) still work.
        try {
            userEmail = jwtService.extractUsername(jwt);
        } catch (Exception e) {
            System.err.println("Invalid JWT token received in request: " + e.getMessage());
            // Do not stop the filter chain; proceed as unauthenticated
            filterChain.doFilter(request, response);
            return;
        }

        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails userDetails = authService.loadUserByUsername(userEmail);
                System.out.println("Attempting to validate token for user: " + userEmail);

                if (jwtService.validateToken(jwt, userDetails)) {
                    System.out.println("Token validation successful for user: " + userEmail);
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } else {
                    System.err.println("Token validation failed for user: " + userEmail);
                }
            } catch (Exception e) {
                System.err.println("Error during token validation: " + e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}
