-- Giant Spawn Part Script
-- Place this script inside the GiantSpawnPart in Workspace
-- This part marks where giants will spawn

local spawnPart = script.Parent

-- Make the part invisible and non-collidable
spawnPart.Transparency = 1
spawnPart.CanCollide = false
spawnPart.Anchored = true

-- Optional: Add a visual indicator in Studio (remove in production)
local selectionBox = spawnPart:FindFirstChild("SelectionBox")
if not selectionBox then
	selectionBox = Instance.new("SelectionBox")
	selectionBox.Parent = spawnPart
	selectionBox.Adornee = spawnPart
	selectionBox.Color3 = Color3.fromRGB(0, 255, 0)
	selectionBox.LineThickness = 0.05
	selectionBox.Transparency = 0.5
end

-- Add a beam effect to show spawn area (optional, only visible in Studio)
local attachment0 = spawnPart:FindFirstChild("Attachment0")
if not attachment0 then
	attachment0 = Instance.new("Attachment")
	attachment0.Name = "Attachment0"
	attachment0.Parent = spawnPart
	attachment0.Position = Vector3.new(0, 5, 0)
end

print("GiantSpawnPart initialized at position:", spawnPart.Position)
