# PowerShell script to update all remaining auth files with Outfit font

$files = @(
    "app\(auth)\agent-selection.tsx",
    "app\(auth)\agent-organization-selection.tsx", 
    "app\(auth)\driver-helper-otp.tsx",
    "app\(auth)\organization-selection.tsx",
    "app\(auth)\passenger-registration.tsx",
    "app\(auth)\staff-options.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Updating $file..."
        
        $content = Get-Content $file -Raw
        
        # Remove Text from react-native import and add custom Text import
        $content = $content -replace "import { (.*), Text, (.*) } from 'react-native';", "import { `$1, `$2 } from 'react-native';"
        $content = $content -replace "import { (.*), Text } from 'react-native';", "import { `$1 } from 'react-native';"
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
