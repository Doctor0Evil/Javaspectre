# spectral-core/validation/ObjectSchemaValidator.psm1

function Test-ObjectSchema {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [object]$Object
    )

    $errors = [System.Collections.Generic.List[string]]::new()

    if (-not $Object) { $errors.Add('Object is null or undefined.') }
    elseif (-not ($Object -is [hashtable] -or $Object -is [pscustomobject])) {
        $errors.Add('Object must be structured (hashtable or PSCustomObject).')
    }

    if (-not $Object.type)     { $errors.Add('Missing required field: type.') }
    if (-not $Object.metadata) { $errors.Add('Missing required field: metadata.') }

    [pscustomobject]@{
        Valid  = ($errors.Count -eq 0)
        Errors = $errors
    }
}

Export-ModuleMember -Function Test-ObjectSchema
