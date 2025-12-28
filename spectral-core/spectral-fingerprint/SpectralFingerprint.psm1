# spectral-core/spectral-fingerprint/SpectralFingerprint.psm1

function Get-SpectralFingerprint {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [object]$Input
    )

    $json = $Input | ConvertTo-Json -Depth 10
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $bytes  = [System.Text.Encoding]::UTF8.GetBytes($json)
    $hash   = $sha256.ComputeHash($bytes)

    ($hash | ForEach-Object { $_.ToString('x2') }) -join ''
}

Export-ModuleMember -Function Get-SpectralFingerprint
