# spectral-core/analysis/SemanticDensity.psm1

function Get-SemanticDensity {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Text
    )

    if (-not $Text.Trim()) { return 0 }

    $tokens = $Text -split '\s+'
    $unique = [System.Collections.Generic.HashSet[string]]::new()
    foreach ($t in $tokens) { [void]$unique.Add($t) }

    [double]($unique.Count) / [double]($tokens.Count)
}

Export-ModuleMember -Function Get-SemanticDensity
