# javaspectre/plugins/PluginRegistry.psm1

# Simple in-memory registry for process lifetime
$script:Plugins = @{}

function Register-JavaspectrePlugin {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Name,

        [Parameter(Mandatory)]
        [scriptblock]$Handler
    )

    $script:Plugins[$Name] = $Handler
}

function Get-JavaspectrePlugin {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Name
    )

    $script:Plugins[$Name]
}

Export-ModuleMember -Function Register-JavaspectrePlugin, Get-JavaspectrePlugin
