# spectral-core/resonance/ResonanceMap.psm1

function Get-ResonanceMap {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Input
    )

    $result = New-Object System.Collections.Generic.List[int]

    $chars = $Input.ToCharArray()
    foreach ($c in $chars) {
        $result.Add(([int][char]$c) % 17)
    }

    $result
}

Export-ModuleMember -Function Get-ResonanceMap
