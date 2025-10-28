-- Improved Giant Controller Script
-- Place this in ServerScriptService
-- This version properly integrates with the lobby system

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local giantEvents = ReplicatedStorage:WaitForChild("GiantEvents")
local lobbyEvents = ReplicatedStorage:WaitForChild("LobbyEvents")

-- Store giant models for each lobby
local lobbyGiants = {}

-- Get the giant spawn part
local giantSpawnPart = workspace:WaitForChild("GiantSpawnPart", 30)
if not giantSpawnPart then
	warn("GiantSpawnPart not found in Workspace!")
	return
end

-- Create a giant clone based on a player with proper scaling
local function createGiantFromPlayer(player, index)
	local character = player.Character
	if not character then
		return nil
	end
	
	-- Wait for character to fully load
	local humanoidRootPart = character:WaitForChild("HumanoidRootPart", 5)
	if not humanoidRootPart then
		return nil
	end
	
	-- Clone the character
	local giant = character:Clone()
	giant.Name = "GiantClone_" .. player.Name .. "_" .. index
	
	-- Scale the giant (3x size)
	local scale = 3
	
	-- Find or create a Humanoid
	local humanoid = giant:FindFirstChildOfClass("Humanoid")
	if humanoid then
		humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
		humanoid.HealthDisplayType = Enum.HealthDisplayType.AlwaysOff
		humanoid.WalkSpeed = 0
		humanoid.JumpPower = 0
		humanoid.AutoRotate = false
	end
	
	-- Scale all body parts
	for _, obj in ipairs(giant:GetDescendants()) do
		if obj:IsA("BasePart") then
			-- Scale size
			obj.Size = obj.Size * scale
			obj.Anchored = false
			obj.CanCollide = false
			obj.Massless = true
			
		elseif obj:IsA("Motor6D") or obj:IsA("Weld") or obj:IsA("ManualWeld") then
			-- Scale joint positions
			obj.C0 = obj.C0 * CFrame.new(obj.C0.Position * (scale - 1))
			obj.C1 = obj.C1 * CFrame.new(obj.C1.Position * (scale - 1))
			
		elseif obj:IsA("Attachment") then
			-- Scale attachments
			obj.Position = obj.Position * scale
			
		elseif obj:IsA("SpecialMesh") then
			-- Keep mesh scale but account for part scaling
			-- No change needed as the part itself is scaled
		end
	end
	
	return giant
end

-- Position giants in formation based on player count
local function positionGiants(giants, centerPosition, playerCount)
	if #giants == 0 then return end
	
	if playerCount == 1 then
		-- Single giant at center
		local giant = giants[1]
		local rootPart = giant:FindFirstChild("HumanoidRootPart")
		if rootPart then
			rootPart.CFrame = CFrame.new(centerPosition)
			rootPart.Anchored = true
		end
		
	elseif playerCount == 2 then
		-- Two giants side by side
		local offset = 12
		for i, giant in ipairs(giants) do
			local rootPart = giant:FindFirstChild("HumanoidRootPart")
			if rootPart then
				local xOffset = (i == 1) and -offset or offset
				rootPart.CFrame = CFrame.new(centerPosition + Vector3.new(xOffset, 0, 0))
				-- Face each other
				local lookAt = centerPosition + Vector3.new(-xOffset, 0, 0)
				rootPart.CFrame = CFrame.new(rootPart.Position, Vector3.new(lookAt.X, rootPart.Position.Y, lookAt.Z))
				rootPart.Anchored = true
			end
		end
		
	else
		-- Circle formation for 3+ players (cool formation!)
		local radius = 18 + (playerCount * 1.5)
		local angleStep = (2 * math.pi) / #giants
		
		for i, giant in ipairs(giants) do
			local rootPart = giant:FindFirstChild("HumanoidRootPart")
			if rootPart then
				-- Calculate position in circle
				local angle = angleStep * (i - 1)
				local x = centerPosition.X + radius * math.cos(angle)
				local z = centerPosition.Z + radius * math.sin(angle)
				local position = Vector3.new(x, centerPosition.Y, z)
				
				-- Face toward center
				local lookAt = Vector3.new(centerPosition.X, position.Y, centerPosition.Z)
				local cframe = CFrame.new(position, lookAt)
				
				rootPart.CFrame = cframe
				rootPart.Anchored = true
			end
		end
	end
end

-- Create and position giants for a lobby
local function updateGiantsForLobby(lobbyCode, players)
	-- Clean up old giants for this lobby
	if lobbyGiants[lobbyCode] then
		for _, giant in ipairs(lobbyGiants[lobbyCode]) do
			if giant and giant.Parent then
				giant:Destroy()
			end
		end
	end
	
	lobbyGiants[lobbyCode] = {}
	
	if #players == 0 or not giantSpawnPart then
		return
	end
	
	-- Create giants for each player
	local giants = {}
	for index, player in ipairs(players) do
		if player and player.Character and player.Character:FindFirstChild("HumanoidRootPart") then
			-- Wait a moment for character to be fully loaded
			wait(0.1)
			
			local giant = createGiantFromPlayer(player, index)
			if giant then
				table.insert(giants, giant)
				table.insert(lobbyGiants[lobbyCode], giant)
			end
		end
	end
	
	if #giants == 0 then
		return
	end
	
	-- Position giants based on player count
	local spawnPosition = giantSpawnPart.Position + Vector3.new(0, 3, 0) -- Slightly above spawn part
	positionGiants(giants, spawnPosition, #players)
	
	-- Parent giants to workspace
	for _, giant in ipairs(giants) do
		giant.Parent = workspace
		
		-- Unanchor the root part after a moment to allow physics
		local rootPart = giant:FindFirstChild("HumanoidRootPart")
		if rootPart then
			task.spawn(function()
				wait(0.5)
				if rootPart and rootPart.Parent then
					rootPart.Anchored = false
					-- Add a body position to keep it floating
					local bodyPosition = Instance.new("BodyPosition")
					bodyPosition.MaxForce = Vector3.new(50000, 50000, 50000)
					bodyPosition.Position = rootPart.Position
					bodyPosition.P = 10000
					bodyPosition.D = 500
					bodyPosition.Parent = rootPart
					
					-- Add body gyro to maintain orientation
					local bodyGyro = Instance.new("BodyGyro")
					bodyGyro.MaxTorque = Vector3.new(50000, 50000, 50000)
					bodyGyro.CFrame = rootPart.CFrame
					bodyGyro.P = 10000
					bodyGyro.D = 500
					bodyGyro.Parent = rootPart
				end
			end)
		end
	end
	
	-- Notify clients about the giants
	local giantNames = {}
	for _, giant in ipairs(giants) do
		table.insert(giantNames, giant.Name)
	end
	
	for _, player in ipairs(players) do
		giantEvents:FireClient(player, "GiantsCreated", {
			giants = giantNames,
			lobbyCode = lobbyCode,
			players = players
		})
	end
end

-- Listen for lobby creation/update events
local currentLobbies = {}

-- Function to get lobby data from LobbyManager
local function onLobbyUpdated(lobbyCode, players)
	if not lobbyCode or not players then return end
	
	currentLobbies[lobbyCode] = players
	
	-- Update giants for this lobby
	updateGiantsForLobby(lobbyCode, players)
end

-- Hook into lobby events
lobbyEvents.OnServerEvent:Connect(function(player, action, data)
	-- We'll create a small delay to let the lobby system process first
	task.spawn(function()
		wait(0.5) -- Wait for lobby system to process
		
		if action == "CreateLobby" or action == "JoinLobby" then
			-- Request current lobby state
			-- The lobby manager will send updates
		end
	end)
end)

-- Monitor for lobby events from the client perspective
local function monitorLobbyChanges()
	lobbyEvents.OnServerEvent:Connect(function(player, action, data)
		if action == "GetLobbyInfo" then
			-- After lobby info is retrieved, check if we need to update giants
			task.spawn(function()
				wait(0.3)
				-- Lobby system will notify us of changes
			end)
		end
	end)
end

monitorLobbyChanges()

-- Create a separate event for the lobby manager to notify us
local lobbyGiantSync = Instance.new("BindableEvent")
lobbyGiantSync.Name = "LobbyGiantSync"
lobbyGiantSync.Parent = ReplicatedStorage

lobbyGiantSync.Event:Connect(function(lobbyCode, players)
	onLobbyUpdated(lobbyCode, players)
end)

-- Handle player characters being added/removed
Players.PlayerAdded:Connect(function(player)
	player.CharacterAdded:Connect(function(character)
		-- Wait for character to load
		character:WaitForChild("HumanoidRootPart", 5)
		wait(1)
		
		-- Check if player is in any lobby and refresh giants
		for lobbyCode, players in pairs(currentLobbies) do
			for _, lobbyPlayer in ipairs(players) do
				if lobbyPlayer == player then
					updateGiantsForLobby(lobbyCode, players)
					break
				end
			end
		end
	end)
end)

-- Cleanup when lobby is destroyed
task.spawn(function()
	while true do
		wait(5)
		
		-- Clean up giants for lobbies that no longer exist
		for lobbyCode, giants in pairs(lobbyGiants) do
			if not currentLobbies[lobbyCode] then
				for _, giant in ipairs(giants) do
					if giant and giant.Parent then
						giant:Destroy()
					end
				end
				lobbyGiants[lobbyCode] = nil
			end
		end
	end
end)

print("ImprovedGiantController loaded successfully")
print("Giants will spawn at:", giantSpawnPart.Position)
