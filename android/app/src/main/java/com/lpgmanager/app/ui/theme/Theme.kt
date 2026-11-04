package com.lpgmanager.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Professional LPG Agency Theme: Dark Navy (#0B192C) with vibrant Flame Orange (#FF6B00)
val FlameOrange = Color(0xFFFF6B00)
val DeepNavy = Color(0xFF0B192C)
val NavySurface = Color(0xFF1E3E62)
val NavyCard = Color(0xFF152A38)
val AccentTeal = Color(0xFF00A896)
val DangerRed = Color(0xFFE63946)
val SuccessGreen = Color(0xFF2EC4B6)

private val DarkColorScheme = darkColorScheme(
    primary = FlameOrange,
    onPrimary = Color.White,
    primaryContainer = Color(0xFF8B3A00),
    onPrimaryContainer = Color(0xFFFFDBCF),
    secondary = AccentTeal,
    onSecondary = Color.White,
    background = DeepNavy,
    onBackground = Color(0xFFF1F5F9),
    surface = NavySurface,
    onSurface = Color.White,
    surfaceVariant = NavyCard,
    error = DangerRed
)

private val LightColorScheme = lightColorScheme(
    primary = FlameOrange,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFFFDBCF),
    onPrimaryContainer = Color(0xFF381400),
    secondary = DeepNavy,
    onSecondary = Color.White,
    background = Color(0xFFF8FAFC),
    onBackground = Color(0xFF0F172A),
    surface = Color.White,
    onSurface = Color(0xFF0F172A),
    surfaceVariant = Color(0xFFF1F5F9),
    error = DangerRed
)

@Composable
fun LpgManagerTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
