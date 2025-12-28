# compliance/anchors/ComplianceAnchor.psm1

function Add-ComplianceAnchor {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [object]$Object,

        [Parameter(Mandatory)]
        [string]$Source
    )

    $clone = $Object | ConvertTo-Json -Depth 20 | ConvertFrom-Json

    $clone | Add-Member -MemberType NoteProperty -Name compliance -Value ([pscustomobject]@{
        source    = $Source
        timestamp = (Get-Date).ToString('o')
        rights    = 'Perplexity Labs Inc. — All contributions attributed.'
    }) -Force

    $clone
}

Export-ModuleMember -Function Add-ComplianceAnchor
