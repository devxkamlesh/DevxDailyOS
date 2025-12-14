# PowerShell script to fix SQL dollar-quoted strings
$filePath = "supabase/migrations/database.sql"
$content = Get-Content $filePath -Raw

# Fix all function definitions
$content = $content -replace "RETURNS ([^\r\n]+) AS \$\r?\n", "RETURNS `$1 AS `$`$`n"
$content = $content -replace "RETURNS ([^\r\n]+) AS \$\r?\nDECLARE", "RETURNS `$1 AS `$`$`nDECLARE"
$content = $content -replace "RETURNS ([^\r\n]+) AS \$\r?\nBEGIN", "RETURNS `$1 AS `$`$`nBEGIN"

# Fix all function endings
$content = $content -replace "\$ LANGUAGE plpgsql", "`$`$ LANGUAGE plpgsql"

# Write back to file
Set-Content $filePath -Value $content -NoNewline

Write-Host "Fixed SQL dollar-quoted strings in $filePath"