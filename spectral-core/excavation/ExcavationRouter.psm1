# spectral-core/excavation/ExcavationRouter.psm1

function Get-ExcavatorForLayer {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Layer
    )

    switch ($Layer.ToLower()) {
        'deep'    { return 'DeepExcavator' }
        'phantom' { return 'PhantomExcavator' }
        default   { return 'ObjectExcavator' }
    }
}

Export-ModuleMember -Function Get-ExcavatorForLayer
