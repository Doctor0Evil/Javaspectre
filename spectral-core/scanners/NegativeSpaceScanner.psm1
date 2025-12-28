# spectral-core/scanners/NegativeSpaceScanner.psm1

function Invoke-NegativeSpaceScan {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [object]$Structure
    )

    $missing = New-Object System.Collections.Generic.List[string]

    if (-not $Structure.children) {
        $missing.Add('Missing children collection.')
    }
    else {
        for ($i = 0; $i -lt $Structure.children.Count; $i++) {
            if (-not $Structure.children[$i]) {
                $missing.Add("Child at index $i is null or undefined.")
            }
        }
    }

    $missing
}

Export-ModuleMember -Function Invoke-NegativeSpaceScan
