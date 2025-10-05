-- LobbyManager.lua
-- Place this in ServerScriptService
-- Manages all lobby operations and giant clone creation

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

-- Wait for remotes
local LobbyRemotes = ReplicatedStorage:WaitForChild("LobbyRemotes")
local CreateLobby = LobbyRemotes:WaitForChild("CreateLobby")
local JoinLobby = LobbyRemotes:WaitForChild("JoinLobby")
local LeaveLobby = LobbyRemotes:WaitForChild("LeaveLobby")
local KickPlayer = LobbyRemotes:WaitForChild("KickPlayer")
local InvitePlayer = LobbyRemotes:WaitForChild("InvitePlayer")
local UpdateLobbyUI = LobbyRemotes:WaitForChild("UpdateLobbyUI")
local UpdateGiantVisibility = LobbyRemotes:WaitForChild("UpdateGiantVisibility")

-- Data structures
local Lobbies = {} -- [code] = {Owner = player, Players = {player1, player2}, Giant = model}
local PlayerLobbies = {} -- [player] = lobbyCode

-- Utility Functions
local function generateCode()
	local chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	local code = ""
	for i = 1, 6 do
		local rand = math.random(1, #chars)
		code = code .. chars:sub(rand, rand)
	end
	return code
end

local function getPlayerNames(playerList)
	local names = {}
	for _, player in ipairs(playerList) do
		table.insert(names, player.Name)
	end
	return names
end

local function updateLobbyForAll(lobbyCode)
	local lobby = Lobbies[lobbyCode]
	if not lobby then return end
	
	for _, player in ipairs(lobby.Players) do
		local isOwner = (player == lobby.Owner)
		UpdateLobbyUI:FireClient(player, {
			Code = lobbyCode,
			Players = getPlayerNames(lobby.Players),
			IsOwner = isOwner
		})
	end
end

local function createGiantClone(lobby)
	-- Create giant model
	local giant = Instance.new("Model")
	giant.Name = "GiantClone"
	
	-- Store body parts for each player
	giant:SetAttribute("PlayerCount", #lobby.Players)
	
	-- Parent to workspace
	giant.Parent = workspace
	
	return giant
end

local function updateGiantClone(lobby)
	if lobby.Giant then
		lobby.Giant:Destroy()
	end
	
	if #lobby.Players == 0 then
		return
	end
	
	-- Create new giant
	local giant = createGiantClone(lobby)
	lobby.Giant = giant
	
	-- Clone and position player characters
	local playerCount = #lobby.Players
	
	if playerCount >= 3 then
		-- Cool formation: Triangle/Circle formation
		local radius = 15
		local angleStep = (2 * math.pi) / playerCount
		
		for i, player in ipairs(lobby.Players) do
			if player.Character and player.Character:FindFirstChild("HumanoidRootPart") then
				local angle = angleStep * (i - 1)
				local xOffset = math.cos(angle) * radius
				local zOffset = math.sin(angle) * radius
				
				-- Clone the player's character
				local clone = player.Character:Clone()
				
				-- Scale up the clone
				for _, part in ipairs(clone:GetDescendants()) do
					if part:IsA("BasePart") then
						part.Size = part.Size * 3 -- Make it 3x bigger
					end
				end
				
				-- Position in formation
				if clone:FindFirstChild("HumanoidRootPart") then
					clone.HumanoidRootPart.CFrame = CFrame.new(xOffset, 10, zOffset)
				end
				
				clone.Name = "GiantPart_" .. player.Name
				clone.Parent = giant
			end
		end
	elseif playerCount == 2 then
		-- Side by side formation
		for i, player in ipairs(lobby.Players) do
			if player.Character and player.Character:FindFirstChild("HumanoidRootPart") then
				local clone = player.Character:Clone()
				
				-- Scale up
				for _, part in ipairs(clone:GetDescendants()) do
					if part:IsA("BasePart") then
						part.Size = part.Size * 3
					end
				end
				
				-- Position side by side
				local xOffset = (i == 1) and -8 or 8
				if clone:FindFirstChild("HumanoidRootPart") then
					clone.HumanoidRootPart.CFrame = CFrame.new(xOffset, 10, 0)
				end
				
				clone.Name = "GiantPart_" .. player.Name
				clone.Parent = giant
			end
		end
	else
		-- Single player
		local player = lobby.Players[1]
		if player.Character and player.Character:FindFirstChild("HumanoidRootPart") then
			local clone = player.Character:Clone()
			
			-- Scale up
			for _, part in ipairs(clone:GetDescendants()) do
				if part:IsA("BasePart") then
					part.Size = part.Size * 3
				end
			end
			
			if clone:FindFirstChild("HumanoidRootPart") then
				clone.HumanoidRootPart.CFrame = CFrame.new(0, 10, 0)
			end
			
			clone.Name = "GiantPart_" .. player.Name
			clone.Parent = giant
		end
	end
	
	-- Update visibility for all players
	updateGiantVisibility(lobby)
end

function updateGiantVisibility(lobby)
	if not lobby.Giant then return end
	
	-- Make giant invisible to everyone first
	for _, player in ipairs(Players:GetPlayers()) do
		UpdateGiantVisibility:FireClient(player, lobby.Giant, false)
	end
	
	-- Make visible only to lobby members
	for _, player in ipairs(lobby.Players) do
		UpdateGiantVisibility:FireClient(player, lobby.Giant, true)
	end
end

local function removeLobby(lobbyCode)
	local lobby = Lobbies[lobbyCode]
	if not lobby then return end
	
	-- Notify all players
	for _, player in ipairs(lobby.Players) do
		UpdateLobbyUI:FireClient(player, nil)
		PlayerLobbies[player] = nil
	end
	
	-- Destroy giant
	if lobby.Giant then
		lobby.Giant:Destroy()
	end
	
	Lobbies[lobbyCode] = nil
end

local function removePlayerFromLobby(player)
	local lobbyCode = PlayerLobbies[player]
	if not lobbyCode then return end
	
	local lobby = Lobbies[lobbyCode]
	if not lobby then return end
	
	-- Remove player from lobby
	for i, p in ipairs(lobby.Players) do
		if p == player then
			table.remove(lobby.Players, i)
			break
		end
	end
	
	PlayerLobbies[player] = nil
	
	-- Update UI for player
	UpdateLobbyUI:FireClient(player, nil)
	
	-- If lobby is empty or owner left, remove lobby
	if #lobby.Players == 0 or player == lobby.Owner then
		removeLobby(lobbyCode)
		return
	end
	
	-- Update for remaining players
	updateLobbyForAll(lobbyCode)
	updateGiantClone(lobby)
end

-- Remote Event Handlers
CreateLobby.OnServerEvent:Connect(function(player)
	-- Remove from current lobby if in one
	if PlayerLobbies[player] then
		removePlayerFromLobby(player)
	end
	
	-- Generate unique code
	local code
	repeat
		code = generateCode()
	until not Lobbies[code]
	
	-- Create lobby
	Lobbies[code] = {
		Owner = player,
		Players = {player},
		Giant = nil
	}
	
	PlayerLobbies[player] = code
	
	-- Update UI
	updateLobbyForAll(code)
	
	-- Create giant
	updateGiantClone(Lobbies[code])
	
	print(player.Name .. " created lobby: " .. code)
end)

JoinLobby.OnServerEvent:Connect(function(player, code)
	code = string.upper(code)
	
	-- Check if lobby exists
	if not Lobbies[code] then
		warn(player.Name .. " tried to join non-existent lobby: " .. code)
		return
	end
	
	-- Remove from current lobby
	if PlayerLobbies[player] then
		removePlayerFromLobby(player)
	end
	
	-- Add to lobby
	table.insert(Lobbies[code].Players, player)
	PlayerLobbies[player] = code
	
	-- Update UI
	updateLobbyForAll(code)
	
	-- Update giant
	updateGiantClone(Lobbies[code])
	
	print(player.Name .. " joined lobby: " .. code)
end)

LeaveLobby.OnServerEvent:Connect(function(player)
	removePlayerFromLobby(player)
	print(player.Name .. " left their lobby")
end)

KickPlayer.OnServerEvent:Connect(function(player, targetName)
	local lobbyCode = PlayerLobbies[player]
	if not lobbyCode then return end
	
	local lobby = Lobbies[lobbyCode]
	if not lobby or lobby.Owner ~= player then return end
	
	-- Find target player
	local targetPlayer = Players:FindFirstChild(targetName)
	if targetPlayer and PlayerLobbies[targetPlayer] == lobbyCode then
		removePlayerFromLobby(targetPlayer)
		print(player.Name .. " kicked " .. targetName .. " from lobby")
	end
end)

-- Handle player leaving game
Players.PlayerRemoving:Connect(function(player)
	if PlayerLobbies[player] then
		removePlayerFromLobby(player)
	end
end)

-- Animation mimicry system
RunService.Heartbeat:Connect(function()
	for lobbyCode, lobby in pairs(Lobbies) do
		if lobby.Giant and #lobby.Players > 0 then
			-- Update each giant part to mimic its player's animation
			for _, player in ipairs(lobby.Players) do
				if player.Character and player.Character:FindFirstChild("HumanoidRootPart") then
					local giantPart = lobby.Giant:FindFirstChild("GiantPart_" .. player.Name)
					if giantPart and giantPart:FindFirstChild("HumanoidRootPart") then
						-- Copy animations by matching the character's humanoid state
						local playerHumanoid = player.Character:FindFirstChild("Humanoid")
						local giantHumanoid = giantPart:FindFirstChild("Humanoid")
						
						if playerHumanoid and giantHumanoid then
							-- Copy animation tracks
							for _, track in ipairs(playerHumanoid:GetPlayingAnimationTracks()) do
								local giantTrack = giantHumanoid:LoadAnimation(track.Animation)
								if giantTrack and not giantTrack.IsPlaying then
									giantTrack:Play()
									giantTrack.TimePosition = track.TimePosition
								end
							end
						end
						
						-- Mirror body part positions/rotations
						for _, part in ipairs(player.Character:GetChildren()) do
							if part:IsA("BasePart") and part.Name ~= "HumanoidRootPart" then
								local giantBodyPart = giantPart:FindFirstChild(part.Name)
								if giantBodyPart and giantBodyPart:IsA("BasePart") then
									-- Copy rotation relative to root
									local relCFrame = player.Character.HumanoidRootPart.CFrame:Inverse() * part.CFrame
									giantBodyPart.CFrame = giantPart.HumanoidRootPart.CFrame * relCFrame
								end
							end
						end
					end
				end
			end
		end
	end
end)

print("LobbyManager loaded successfully!")
