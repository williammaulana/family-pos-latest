-- LobbyRemotes.lua
-- Place this in ReplicatedStorage
-- Creates RemoteEvents for client-server communication

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local LobbyRemotes = Instance.new("Folder")
LobbyRemotes.Name = "LobbyRemotes"
LobbyRemotes.Parent = ReplicatedStorage

-- Create RemoteEvents
local CreateLobby = Instance.new("RemoteEvent")
CreateLobby.Name = "CreateLobby"
CreateLobby.Parent = LobbyRemotes

local JoinLobby = Instance.new("RemoteEvent")
JoinLobby.Name = "JoinLobby"
JoinLobby.Parent = LobbyRemotes

local LeaveLobby = Instance.new("RemoteEvent")
LeaveLobby.Name = "LeaveLobby"
LeaveLobby.Parent = LobbyRemotes

local KickPlayer = Instance.new("RemoteEvent")
KickPlayer.Name = "KickPlayer"
KickPlayer.Parent = LobbyRemotes

local InvitePlayer = Instance.new("RemoteEvent")
InvitePlayer.Name = "InvitePlayer"
InvitePlayer.Parent = LobbyRemotes

local UpdateLobbyUI = Instance.new("RemoteEvent")
UpdateLobbyUI.Name = "UpdateLobbyUI"
UpdateLobbyUI.Parent = LobbyRemotes

local UpdateGiantVisibility = Instance.new("RemoteEvent")
UpdateGiantVisibility.Name = "UpdateGiantVisibility"
UpdateGiantVisibility.Parent = LobbyRemotes

print("LobbyRemotes created successfully!")
