# infrastructure/logging/JavaspectreLogger.psm1

function Write-JavaspectreLog {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Event,

        [Parameter()]
        [object]$Data = $null
    )

    $entry = [pscustomobject]@{
        event     = $Event
        data      = $Data
        timestamp = (Get-Date).ToString('o')
        system    = 'Javaspectre'
    }

    $entry | ConvertTo-Json -Depth 10
}

Export-ModuleMember -Function Write-JavaspectreLog
