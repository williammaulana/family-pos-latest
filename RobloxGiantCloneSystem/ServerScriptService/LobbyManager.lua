-- Lobby Manager Script
-- Place this in ServerScriptService

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

-- Create RemoteEvents if they don't exist
local lobbyEvents = ReplicatedStorage:FindFirstChild("LobbyEvents")
if not lobbyEvents then
	lobbyEvents = Instance.new("RemoteEvent")
	lobbyEvents.Name = "LobbyEvents"
	lobbyEvents.Parent = ReplicatedStorage
end

-- Lobby data structure
local lobbies = {}
local playerToLobby = {}

-- Generate a random 6-character code
local function generateLobbyCode()
	local characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	local code = ""
	for i = 1, 6 do
		local randomIndex = math.random(1, #characters)
		code = code .. characters:sub(randomIndex, randomIndex)
	end
	-- Make sure code is unique
	if lobbies[code] then
		return generateLobbyCode()
	end
	return code
end

-- Create a new lobby
local function createLobby(owner)
	local code = generateLobbyCode()
	lobbies[code] = {
		owner = owner,
		players = {owner},
		code = code,
		created = tick()
	}
	playerToLobby[owner.UserId] = code
	return code
end

-- Add player to lobby
local function addPlayerToLobby(player, code)
	local lobby = lobbies[code]
	if not lobby then
		return false, "Lobby not found"
	end
	
	-- Check if player is already in a lobby
	if playerToLobby[player.UserId] then
		return false, "You are already in a lobby"
	end
	
	-- Check if lobby is full (max 10 players)
	if #lobby.players >= 10 then
		return false, "Lobby is full"
	end
	
	table.insert(lobby.players, player)
	playerToLobby[player.UserId] = code
	
	-- Notify all players in lobby
	for _, p in ipairs(lobby.players) do
		lobbyEvents:FireClient(p, "PlayerJoined", {
			player = player.Name,
			playerCount = #lobby.players,
			players = lobby.players
		})
	end
	
	return true, "Joined successfully"
end

-- Remove player from lobby
local function removePlayerFromLobby(player, targetPlayer)
	local code = playerToLobby[player.UserId]
	if not code then
		return false, "You are not in a lobby"
	end
	
	local lobby = lobbies[code]
	if not lobby then
		return false, "Lobby not found"
	end
	
	-- Check if requesting player is the owner (for kick)
	if targetPlayer and targetPlayer ~= player then
		if lobby.owner ~= player then
			return false, "Only the owner can kick players"
		end
	end
	
	local playerToRemove = targetPlayer or player
	
	-- Remove player from lobby
	for i, p in ipairs(lobby.players) do
		if p == playerToRemove then
			table.remove(lobby.players, i)
			break
		end
	end
	
	playerToLobby[playerToRemove.UserId] = nil
	
	-- If lobby is empty, delete it
	if #lobby.players == 0 then
		lobbies[code] = nil
	else
		-- If owner left, assign new owner
		if lobby.owner == playerToRemove then
			lobby.owner = lobby.players[1]
		end
		
		-- Notify remaining players
		for _, p in ipairs(lobby.players) do
			lobbyEvents:FireClient(p, "PlayerLeft", {
				player = playerToRemove.Name,
				playerCount = #lobby.players,
				players = lobby.players,
				newOwner = lobby.owner.Name
			})
		end
	end
	
	-- Notify the removed player
	lobbyEvents:FireClient(playerToRemove, "LobbyLeft", {})
	
	return true, "Left lobby successfully"
end

-- Get lobby info for a player
local function getLobbyInfo(player)
	local code = playerToLobby[player.UserId]
	if not code then
		return nil
	end
	
	local lobby = lobbies[code]
	if not lobby then
		return nil
	end
	
	return {
		code = code,
		owner = lobby.owner.Name,
		isOwner = lobby.owner == player,
		playerCount = #lobby.players,
		players = lobby.players
	}
end

-- Handle remote events
lobbyEvents.OnServerEvent:Connect(function(player, action, data)
	if action == "CreateLobby" then
		-- Check if player is already in a lobby
		if playerToLobby[player.UserId] then
			lobbyEvents:FireClient(player, "Error", "You are already in a lobby")
			return
		end
		
		local code = createLobby(player)
		local lobbyInfo = getLobbyInfo(player)
		lobbyEvents:FireClient(player, "LobbyCreated", lobbyInfo)
		
	elseif action == "JoinLobby" then
		local code = data.code
		local success, message = addPlayerToLobby(player, code)
		
		if success then
			local lobbyInfo = getLobbyInfo(player)
			lobbyEvents:FireClient(player, "LobbyJoined", lobbyInfo)
		else
			lobbyEvents:FireClient(player, "Error", message)
		end
		
	elseif action == "LeaveLobby" then
		removePlayerFromLobby(player)
		
	elseif action == "KickPlayer" then
		local targetPlayerName = data.playerName
		local targetPlayer = Players:FindFirstChild(targetPlayerName)
		
		if targetPlayer then
			local success, message = removePlayerFromLobby(player, targetPlayer)
			if not success then
				lobbyEvents:FireClient(player, "Error", message)
			end
		else
			lobbyEvents:FireClient(player, "Error", "Player not found")
		end
		
	elseif action == "GetLobbyInfo" then
		local lobbyInfo = getLobbyInfo(player)
		if lobbyInfo then
			lobbyEvents:FireClient(player, "LobbyInfo", lobbyInfo)
		else
			lobbyEvents:FireClient(player, "NoLobby", {})
		end
	end
end)

-- Handle player leaving game
Players.PlayerRemoving:Connect(function(player)
	if playerToLobby[player.UserId] then
		removePlayerFromLobby(player)
	end
end)

print("LobbyManager loaded successfully")
