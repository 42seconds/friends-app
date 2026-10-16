<#
  Builds the &FRIENDS board in Azure DevOps in one go:
    - Sprint 1 to Sprint 7 with their dates, added to the team
    - every Epic, Feature and User Story from azure-boards-backlog.json
      with its real state (New / Active / Closed), sprint, tags and parent

  Run it ONCE on a new, empty project (Agile process):

    cd friends-app\docs\azure-devops
    powershell -ExecutionPolicy Bypass -File .\setup-azure-boards.ps1 -Org ST10448302 -Project FRIENDS-App

  It asks for a Personal Access Token (PAT). Make one at
  https://dev.azure.com/<org>/_usersSettings/tokens with the scopes
  "Work Items: Read & write" and "Project and Team: Read & write".
  The token is only used for this run; it is never saved.

  Optional: -AssignTo "you@example.com" sets Assigned To on every item.
#>
param(
  [Parameter(Mandatory = $true)] [string] $Org,
  [string] $Project = 'FRIENDS-App',
  [string] $AssignTo = ''
)

$ErrorActionPreference = 'Stop'
$api = '7.1'
$base = "https://dev.azure.com/$Org/$([uri]::EscapeDataString($Project))"

$secure = Read-Host 'Paste your Azure DevOps PAT (input hidden)' -AsSecureString
$pat = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
$auth = @{ Authorization = 'Basic ' + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$pat")) }

function Call($method, $url, $body, $contentType = 'application/json') {
  $params = @{ Method = $method; Uri = $url; Headers = $auth; ContentType = $contentType }
  if ($null -ne $body) {
    $json = ConvertTo-Json -InputObject $body -Depth 10
    $params.Body = [Text.Encoding]::UTF8.GetBytes($json)
  }
  Invoke-RestMethod @params
}

# ---- Check the project -------------------------------------------------
try {
  $proj = Call GET "https://dev.azure.com/$Org/_apis/projects/$([uri]::EscapeDataString($Project))?includeCapabilities=true&api-version=$api" $null
} catch {
  Write-Host "Can't open project '$Project' in organisation '$Org'. Check the names and the PAT scopes." -ForegroundColor Red
  throw
}
$existing = Call POST "$base/_apis/wit/wiql?api-version=$api" @{ query = "SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = '$Project'" }
if ($existing.workItems.Count -gt 0) {
  Write-Host "This project already has $($existing.workItems.Count) work items. Run this on a NEW, empty project so nothing is doubled." -ForegroundColor Red
  exit 1
}
$team = "$Project Team"
Write-Host "Project found: $($proj.name)" -ForegroundColor Green

# ---- Sprints -----------------------------------------------------------
$sprints = @(
  @{ n = 1; start = '2026-07-21'; finish = '2026-08-03' },
  @{ n = 2; start = '2026-08-04'; finish = '2026-08-17' },
  @{ n = 3; start = '2026-08-18'; finish = '2026-08-31' },
  @{ n = 4; start = '2026-09-01'; finish = '2026-09-14' },
  @{ n = 5; start = '2026-09-15'; finish = '2026-09-28' },
  @{ n = 6; start = '2026-09-29'; finish = '2026-10-12' },
  @{ n = 7; start = '2026-10-13'; finish = '2026-10-26' }
)
$nodes = Call GET "$base/_apis/wit/classificationnodes/Iterations?`$depth=1&api-version=$api" $null
foreach ($s in $sprints) {
  $name = "Sprint $($s.n)"
  $attrs = @{ startDate = "$($s.start)T00:00:00Z"; finishDate = "$($s.finish)T00:00:00Z" }
  $node = $nodes.children | Where-Object { $_.name -eq $name }
  if ($node) {
    $node = Call PATCH "$base/_apis/wit/classificationnodes/Iterations/$([uri]::EscapeDataString($name))?api-version=$api" @{ attributes = $attrs }
  } else {
    $node = Call POST "$base/_apis/wit/classificationnodes/Iterations?api-version=$api" @{ name = $name; attributes = $attrs }
  }
  try {
    Call POST "$base/$([uri]::EscapeDataString($team))/_apis/work/teamsettings/iterations?api-version=$api" @{ id = $node.identifier } | Out-Null
  } catch { } # already on the team
  Write-Host "  $name  $($s.start) to $($s.finish)"
}

# ---- Work items --------------------------------------------------------
$items = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'azure-boards-backlog.json') | ConvertFrom-Json
$ids = @{}
$i = 0
foreach ($it in $items) {
  $ops = @(
    @{ op = 'add'; path = '/fields/System.Title'; value = $it.title },
    @{ op = 'add'; path = '/fields/System.IterationPath'; value = "$Project\Sprint $($it.sprint)" }
  )
  if ($it.tags) { $ops += @{ op = 'add'; path = '/fields/System.Tags'; value = $it.tags } }
  if ($it.description) { $ops += @{ op = 'add'; path = '/fields/System.Description'; value = $it.description } }
  if ($AssignTo) { $ops += @{ op = 'add'; path = '/fields/System.AssignedTo'; value = $AssignTo } }
  if ($null -ne $it.parent) {
    $ops += @{ op = 'add'; path = '/relations/-'; value = @{ rel = 'System.LinkTypes.Hierarchy-Reverse'; url = "https://dev.azure.com/$Org/_apis/wit/workItems/$($ids[[int]$it.parent])" } }
  }
  $type = [uri]::EscapeDataString($it.type)
  $wi = Call POST "$base/_apis/wit/workitems/`$$($type)?api-version=$api" $ops 'application/json-patch+json'
  $ids[$i] = $wi.id

  # New items always start as "New"; move them to their real state.
  if ($it.state -ne 'New') {
    Call PATCH "https://dev.azure.com/$Org/_apis/wit/workitems/$($wi.id)?api-version=$api" @(@{ op = 'add'; path = '/fields/System.State'; value = $it.state }) 'application/json-patch+json' | Out-Null
  }
  $i++
  Write-Host ("  #{0,-4} {1,-11} {2,-7} {3}" -f $wi.id, $it.type, $it.state, $it.title)
}

Write-Host ""
Write-Host "Done: $($items.Count) work items in 7 sprints." -ForegroundColor Green
Write-Host "Open https://dev.azure.com/$Org/$Project/_backlogs and switch the level to Epics."
