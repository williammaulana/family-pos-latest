-- Giant Controller Script
-- Place this in ServerScriptService

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

-- Create RemoteEvent if it doesn't exist
local giantEvents = ReplicatedStorage:FindFirstChild("GiantEvents")
if not giantEvents then
	giantEvents = Instance.new("RemoteEvent")
	giantEvents.Name = "GiantEvents"
	giantEvents.Parent = ReplicatedStorage
end

local lobbyEvents = ReplicatedStorage:WaitForChild("LobbyEvents")

-- Store giant models for each lobby
local lobbyGiants = {}
local playerToLobby = {}

-- Get the giant spawn part
local giantSpawnPart = workspace:WaitForChild("GiantSpawnPart", 30)
if not giantSpawnPart then
	warn("GiantSpawnPart not found in Workspace!")
end

-- Create a giant clone based on a player
local function createGiantFromPlayer(player)
	local character = player.Character
	if not character then
		return nil
	end
	
	-- Clone the character
	local giant = character:Clone()
	giant.Name = "GiantClone_" .. player.Name
	
	-- Scale the giant (3x size)
	local scale = 3
	for _, part in ipairs(giant:GetDescendants()) do
		if part:IsA("BasePart") then
			part.Size = part.Size * scale
			part.Anchored = false
			part.CanCollide = false
		elseif part:IsA("Motor6D") or part:IsA("Weld") then
			part.C0 = part.C0 * CFrame.new(part.C0.Position * (scale - 1))
			part.C1 = part.C1 * CFrame.new(part.C1.Position * (scale - 1))
		elseif part:IsA("Humanoid") then
			part.WalkSpeed = 0
			part.JumpPower = 0
		end
	end
	
	return giant
end

-- Position giants in a circle formation
local function positionGiants(giants, centerPosition)
	local playerCount = #giants
	
	if playerCount == 1 then
		-- Single giant at center
		giants[1]:SetPrimaryPartCFrame(CFrame.new(centerPosition))
	elseif playerCount == 2 then
		-- Two giants side by side
		local offset = 10
		giants[1]:SetPrimaryPartCFrame(CFrame.new(centerPosition + Vector3.new(-offset, 0, 0)))
		giants[2]:SetPrimaryPartCFrame(CFrame.new(centerPosition + Vector3.new(offset, 0, 0)))
	else
		-- Circle formation for 3+ players
		local radius = 15 + (playerCount * 2) -- Radius increases with player count
		local angleStep = (2 * math.pi) / playerCount
		
		for i, giant in ipairs(giants) do
			local angle = angleStep * (i - 1)
			local x = centerPosition.X + radius * math.cos(angle)
			local z = centerPosition.Z + radius * math.sin(angle)
			local position = Vector3.new(x, centerPosition.Y, z)
			
			-- Face toward center
			local lookAt = centerPosition
			local cframe = CFrame.new(position, Vector3.new(lookAt.X, position.Y, lookAt.Z))
			
			giant:SetPrimaryPartCFrame(cframe)
		end
	end
end

-- Update giants for a lobby
local function updateGiantsForLobby(lobbyCode, players)
	-- Clean up old giants
	if lobbyGiants[lobbyCode] then
		for _, giant in ipairs(lobbyGiants[lobbyCode]) do
			giant:Destroy()
		end
	end
	
	lobbyGiants[lobbyCode] = {}
	
	if #players == 0 or not giantSpawnPart then
		return
	end
	
	-- Create giants for each player
	local giants = {}
	for _, player in ipairs(players) do
		if player.Character and player.Character:FindFirstChild("HumanoidRootPart") then
			local giant = createGiantFromPlayer(player)
			if giant then
				table.insert(giants, giant)
				table.insert(lobbyGiants[lobbyCode], giant)
			end
		end
	end
	
	-- Position giants
	local spawnPosition = giantSpawnPart.Position
	positionGiants(giants, spawnPosition)
	
	-- Parent giants to workspace (but make them invisible to non-lobby players)
	for i, giant in ipairs(giants) do
		giant.Parent = workspace
		
		-- Set all parts to be invisible initially (client will handle visibility)
		for _, part in ipairs(giant:GetDescendants()) do
			if part:IsA("BasePart") then
				part.Transparency = 1
			end
		end
	end
	
	-- Notify clients about the giants
	for _, player in ipairs(players) do
		local giantNames = {}
		for _, giant in ipairs(giants) do
			table.insert(giantNames, giant.Name)
		end
		giantEvents:FireClient(player, "GiantsCreated", {
			giants = giantNames,
			lobbyCode = lobbyCode
		})
	end
end

-- Listen for lobby updates
lobbyEvents.OnServerEvent:Connect(function(player, action, data)
	if action == "UpdateGiants" then
		local lobbyCode = data.code
		local players = data.players
		updateGiantsForLobby(lobbyCode, players)
	end
end)

-- Handle character added/removed
Players.PlayerAdded:Connect(function(player)
	player.CharacterAdded:Connect(function(character)
		-- Wait a bit for character to load
		wait(1)
		
		-- Check if player is in a lobby and update giants
		local lobbyCode = playerToLobby[player.UserId]
		if lobbyCode then
			lobbyEvents:FireAllClients("CharacterUpdated", {
				player = player,
				lobbyCode = lobbyCode
			})
		end
	end)
end)

print("GiantController loaded successfully")
