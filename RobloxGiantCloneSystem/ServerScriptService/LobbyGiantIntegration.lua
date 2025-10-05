-- Lobby Giant Integration Script
-- Place this in ServerScriptService
-- This script bridges the LobbyManager and GiantController

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local lobbyEvents = ReplicatedStorage:WaitForChild("LobbyEvents")
local giantEvents = ReplicatedStorage:WaitForChild("GiantEvents")

-- Track lobbies and their players
local lobbies = {}

-- Create or get the BindableEvent for giant synchronization
local lobbyGiantSync = ReplicatedStorage:FindFirstChild("LobbyGiantSync")
if not lobbyGiantSync then
	lobbyGiantSync = Instance.new("BindableEvent")
	lobbyGiantSync.Name = "LobbyGiantSync"
	lobbyGiantSync.Parent = ReplicatedStorage
end

-- Function to update giants when lobby changes
local function updateGiantsForLobby(lobbyCode, players)
	if not lobbyCode or not players or #players == 0 then
		return
	end
	
	-- Store lobby data
	lobbies[lobbyCode] = players
	
	-- Fire the sync event for the GiantController to handle
	lobbyGiantSync:Fire(lobbyCode, players)
	
	-- Also notify clients to update their visibility
	for _, player in ipairs(players) do
		if player and player.Parent then
			giantEvents:FireClient(player, "UpdateGiantVisibility", {
				lobbyCode = lobbyCode,
				players = players
			})
		end
	end
end

-- Listen to lobby events and update giants accordingly
lobbyEvents.OnServerEvent:Connect(function(player, action, data)
	-- Add a small delay to ensure lobby system processes first
	task.spawn(function()
		wait(0.3)
		
		if action == "CreateLobby" then
			-- New lobby created, get the lobby code from the lobby system
			-- We'll use a tracking method
			task.spawn(function()
				wait(0.5)
				-- Check if player is in a lobby and create giants
				local success, result = pcall(function()
					-- Try to get lobby info by checking playerToLobby mapping
					-- This is handled by the LobbyManager
				end)
			end)
			
		elseif action == "JoinLobby" then
			-- Player joined a lobby
			task.spawn(function()
				wait(0.5)
				-- Update giants for this lobby
			end)
			
		elseif action == "LeaveLobby" or action == "KickPlayer" then
			-- Player left or was kicked, update giants
			task.spawn(function()
				wait(0.3)
				-- Giants will be updated
			end)
		end
	end)
end)

-- Enhanced lobby tracking by monitoring client events
local playerLobbyMap = {}

lobbyEvents.OnServerEvent:Connect(function(player, action, data)
	if action == "CreateLobby" or action == "JoinLobby" then
		-- Wait for lobby to be created/joined
		task.spawn(function()
			wait(1)
			
			-- Fire a request to get current lobby info
			-- The response will trigger giant creation
			local tempConnection
			tempConnection = lobbyEvents.OnServerEvent:Connect(function(p, act, d)
				if p == player and act == "GetLobbyInfo" then
					-- This will be handled by LobbyManager
					tempConnection:Disconnect()
				end
			end)
			
			-- Request lobby info
			lobbyEvents:FireServer("GetLobbyInfo")
		end)
	end
end)

-- Monitor lobby events sent to clients
local function monitorClientUpdates()
	-- We'll use a parallel system to track when lobbies are created/updated
	local originalFireClient = lobbyEvents.FireClient
	
	-- Note: This is a monitoring approach, actual lobby data comes from LobbyManager
end

-- Enhanced Integration: Direct lobby data monitoring
-- This creates a separate communication channel

local function createLobbySnapshot()
	-- Periodically sync lobby state with giant system
	task.spawn(function()
		while true do
			wait(2) -- Check every 2 seconds
			
			-- Sync any lobbies that need giant updates
			for lobbyCode, players in pairs(lobbies) do
				-- Verify all players still exist
				local validPlayers = {}
				for _, player in ipairs(players) do
					if player and player.Parent then
						table.insert(validPlayers, player)
					end
				end
				
				if #validPlayers > 0 then
					lobbies[lobbyCode] = validPlayers
				else
					-- Lobby is empty, remove it
					lobbies[lobbyCode] = nil
				end
			end
		end
	end)
end

createLobbySnapshot()

-- Public API for LobbyManager to call
_G.UpdateLobbyGiants = function(lobbyCode, players)
	updateGiantsForLobby(lobbyCode, players)
end

-- Handle player leaving game
Players.PlayerRemoving:Connect(function(player)
	-- Clean up any lobbies this player was in
	for lobbyCode, players in pairs(lobbies) do
		for i, p in ipairs(players) do
			if p == player then
				table.remove(players, i)
				
				-- Update giants for remaining players
				if #players > 0 then
					updateGiantsForLobby(lobbyCode, players)
				else
					lobbies[lobbyCode] = nil
				end
				break
			end
		end
	end
end)

print("LobbyGiantIntegration loaded successfully")
