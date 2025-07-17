# PowerShell script to verify Plus Jakarta Sans font implementation

Write-Host "Checking Plus Jakarta Sans font implementation..." -ForegroundColor Yellow

# Check if the font package is installed
$packageJson = Get-Content "package.json" | ConvertFrom-Json
if ($packageJson.dependencies."@expo-google-fonts/plus-jakarta-sans") {
    Write-Host "✅ Plus Jakarta Sans package is installed" -ForegroundColor Green
} else {
    Write-Host "❌ Plus Jakarta Sans package is not installed" -ForegroundColor Red
}

# Check if old Outfit fonts are removed
if ($packageJson.dependencies."@expo-google-fonts/outfit") {
    Write-Host "⚠️  Old Outfit font package is still installed" -ForegroundColor Yellow
} else {
    Write-Host "✅ Old Outfit font package has been removed" -ForegroundColor Green
}

# Check fonts.ts file
$fontsFile = "utils\fonts.ts"
if (Test-Path $fontsFile) {
    $content = Get-Content $fontsFile -Raw
    if ($content -match "PlusJakartaSans") {
        Write-Host "✅ fonts.ts has been updated to use Plus Jakarta Sans" -ForegroundColor Green
    } else {
        Write-Host "❌ fonts.ts still uses old font references" -ForegroundColor Red
    }
} else {
    Write-Host "❌ fonts.ts file not found" -ForegroundColor Red
}

# Check app layout file
$layoutFile = "app\_layout.tsx"
if (Test-Path $layoutFile) {
    $content = Get-Content $layoutFile -Raw
    if ($content -match "plusJakartaSansFonts") {
        Write-Host "✅ App layout has been updated to use Plus Jakarta Sans" -ForegroundColor Green
    } else {
        Write-Host "❌ App layout still uses old font references" -ForegroundColor Red
    }
} else {
    Write-Host "❌ App layout file not found" -ForegroundColor Red
}

Write-Host "`nPlus Jakarta Sans font migration check completed!" -ForegroundColor Cyan
Write-Host "All components using FONT_WEIGHTS and TYPOGRAPHY will automatically use Plus Jakarta Sans." -ForegroundColor Green
