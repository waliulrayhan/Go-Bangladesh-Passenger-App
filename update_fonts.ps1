# PowerShell script to verify Plus Jakarta Sans font implementation

Write-Host "Checking Plus Jakarta Sans font implementation..."

# Check if the font package is installed
$packageJson = Get-Content "package.json" | ConvertFrom-Json
if ($packageJson.dependencies."@expo-google-fonts/plus-jakarta-sans") {
    Write-Host "✅ Plus Jakarta Sans package is installed"
} else {
    Write-Host "❌ Plus Jakarta Sans package is not installed"
}

# Check if old Outfit fonts are removed
if ($packageJson.dependencies."@expo-google-fonts/outfit") {
    Write-Host "⚠️  Old Outfit font package is still installed"
} else {
    Write-Host "✅ Old Outfit font package has been removed"
}

# Check fonts.ts file
$fontsFile = "utils\fonts.ts"
if (Test-Path $fontsFile) {
    $content = Get-Content $fontsFile -Raw
    if ($content -match "PlusJakartaSans") {
        Write-Host "✅ fonts.ts has been updated to use Plus Jakarta Sans"
    } else {
        Write-Host "❌ fonts.ts still uses old font references"
    }
} else {
    Write-Host "❌ fonts.ts file not found"
}
        $content = $content -replace "import { Text, (.*) } from 'react-native';", "import { `$1 } from 'react-native';"
        
        # Add Text import after existing imports
        if ($content -notmatch "import { Text } from '../../components/ui/Text';") {
            $content = $content -replace "(import.*from '../../components/ui/Input';)", "`$1`nimport { Text } from '../../components/ui/Text';"
        }
        
        Set-Content $file $content -NoNewline
        Write-Host "Updated $file"
    }
}

Write-Host "Font updates completed!"
