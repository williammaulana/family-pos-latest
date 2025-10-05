-- LobbyGui.lua
-- Place this in StarterGui as a LocalScript
-- Handles the lobby GUI and client-side interactions

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- Wait for remotes
local LobbyRemotes = ReplicatedStorage:WaitForChild("LobbyRemotes")
local CreateLobby = LobbyRemotes:WaitForChild("CreateLobby")
local JoinLobby = LobbyRemotes:WaitForChild("JoinLobby")
local LeaveLobby = LobbyRemotes:WaitForChild("LeaveLobby")
local KickPlayer = LobbyRemotes:WaitForChild("KickPlayer")
local InvitePlayer = LobbyRemotes:WaitForChild("InvitePlayer")
local UpdateLobbyUI = LobbyRemotes:WaitForChild("UpdateLobbyUI")

-- Create ScreenGui
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "LobbyGui"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

-- Create Open Lobby Button (always visible)
local openButton = Instance.new("TextButton")
openButton.Name = "OpenLobbyButton"
openButton.Size = UDim2.new(0, 200, 0, 50)
openButton.Position = UDim2.new(0.5, -100, 0.05, 0)
openButton.BackgroundColor3 = Color3.fromRGB(52, 152, 219)
openButton.Text = "Open Lobby"
openButton.TextColor3 = Color3.new(1, 1, 1)
openButton.TextSize = 20
openButton.Font = Enum.Font.GothamBold
openButton.BorderSizePixel = 0
openButton.Parent = screenGui

-- Add UICorner
local corner1 = Instance.new("UICorner")
corner1.CornerRadius = UDim.new(0, 8)
corner1.Parent = openButton

-- Create Lobby Frame (hidden by default)
local lobbyFrame = Instance.new("Frame")
lobbyFrame.Name = "LobbyFrame"
lobbyFrame.Size = UDim2.new(0, 400, 0, 500)
lobbyFrame.Position = UDim2.new(0.5, -200, 0.5, -250)
lobbyFrame.BackgroundColor3 = Color3.fromRGB(44, 62, 80)
lobbyFrame.BorderSizePixel = 0
lobbyFrame.Visible = false
lobbyFrame.Parent = screenGui

local corner2 = Instance.new("UICorner")
corner2.CornerRadius = UDim.new(0, 12)
corner2.Parent = lobbyFrame

-- Title
local title = Instance.new("TextLabel")
title.Name = "Title"
title.Size = UDim2.new(1, 0, 0, 50)
title.BackgroundColor3 = Color3.fromRGB(52, 73, 94)
title.Text = "Giant Clone Lobby"
title.TextColor3 = Color3.new(1, 1, 1)
title.TextSize = 24
title.Font = Enum.Font.GothamBold
title.BorderSizePixel = 0
title.Parent = lobbyFrame

local corner3 = Instance.new("UICorner")
corner3.CornerRadius = UDim.new(0, 12)
corner3.Parent = title

-- Close Button
local closeButton = Instance.new("TextButton")
closeButton.Name = "CloseButton"
closeButton.Size = UDim2.new(0, 40, 0, 40)
closeButton.Position = UDim2.new(1, -45, 0, 5)
closeButton.BackgroundColor3 = Color3.fromRGB(231, 76, 60)
closeButton.Text = "X"
closeButton.TextColor3 = Color3.new(1, 1, 1)
closeButton.TextSize = 20
closeButton.Font = Enum.Font.GothamBold
closeButton.BorderSizePixel = 0
closeButton.Parent = title

local corner4 = Instance.new("UICorner")
corner4.CornerRadius = UDim.new(0, 8)
corner4.Parent = closeButton

-- Lobby Code Display
local codeLabel = Instance.new("TextLabel")
codeLabel.Name = "CodeLabel"
codeLabel.Size = UDim2.new(1, -40, 0, 40)
codeLabel.Position = UDim2.new(0, 20, 0, 70)
codeLabel.BackgroundColor3 = Color3.fromRGB(52, 73, 94)
codeLabel.Text = "Lobby Code: ----"
codeLabel.TextColor3 = Color3.new(1, 1, 1)
codeLabel.TextSize = 18
codeLabel.Font = Enum.Font.Gotham
codeLabel.BorderSizePixel = 0
codeLabel.Parent = lobbyFrame

local corner5 = Instance.new("UICorner")
corner5.CornerRadius = UDim.new(0, 8)
corner5.Parent = codeLabel

-- Player List
local playerListFrame = Instance.new("ScrollingFrame")
playerListFrame.Name = "PlayerListFrame"
playerListFrame.Size = UDim2.new(1, -40, 0, 200)
playerListFrame.Position = UDim2.new(0, 20, 0, 130)
playerListFrame.BackgroundColor3 = Color3.fromRGB(52, 73, 94)
playerListFrame.BorderSizePixel = 0
playerListFrame.ScrollBarThickness = 8
playerListFrame.Parent = lobbyFrame

local corner6 = Instance.new("UICorner")
corner6.CornerRadius = UDim.new(0, 8)
corner6.Parent = playerListFrame

local listLayout = Instance.new("UIListLayout")
listLayout.Padding = UDim.new(0, 5)
listLayout.SortOrder = Enum.SortOrder.Name
listLayout.Parent = playerListFrame

-- Join Code Input
local codeInput = Instance.new("TextBox")
codeInput.Name = "CodeInput"
codeInput.Size = UDim2.new(1, -40, 0, 40)
codeInput.Position = UDim2.new(0, 20, 0, 350)
codeInput.BackgroundColor3 = Color3.fromRGB(52, 73, 94)
codeInput.PlaceholderText = "Enter lobby code..."
codeInput.Text = ""
codeInput.TextColor3 = Color3.new(1, 1, 1)
codeInput.TextSize = 16
codeInput.Font = Enum.Font.Gotham
codeInput.BorderSizePixel = 0
codeInput.ClearTextOnFocus = false
codeInput.Parent = lobbyFrame

local corner7 = Instance.new("UICorner")
corner7.CornerRadius = UDim.new(0, 8)
corner7.Parent = codeInput

-- Button Frame
local buttonFrame = Instance.new("Frame")
buttonFrame.Name = "ButtonFrame"
buttonFrame.Size = UDim2.new(1, -40, 0, 80)
buttonFrame.Position = UDim2.new(0, 20, 0, 405)
buttonFrame.BackgroundTransparency = 1
buttonFrame.Parent = lobbyFrame

-- Create/Join Button
local createJoinButton = Instance.new("TextButton")
createJoinButton.Name = "CreateJoinButton"
createJoinButton.Size = UDim2.new(0.48, 0, 0, 35)
createJoinButton.Position = UDim2.new(0, 0, 0, 0)
createJoinButton.BackgroundColor3 = Color3.fromRGB(46, 204, 113)
createJoinButton.Text = "Create Lobby"
createJoinButton.TextColor3 = Color3.new(1, 1, 1)
createJoinButton.TextSize = 16
createJoinButton.Font = Enum.Font.GothamBold
createJoinButton.BorderSizePixel = 0
createJoinButton.Parent = buttonFrame

local corner8 = Instance.new("UICorner")
corner8.CornerRadius = UDim.new(0, 8)
corner8.Parent = createJoinButton

-- Leave Button
local leaveButton = Instance.new("TextButton")
leaveButton.Name = "LeaveButton"
leaveButton.Size = UDim2.new(0.48, 0, 0, 35)
leaveButton.Position = UDim2.new(0.52, 0, 0, 0)
leaveButton.BackgroundColor3 = Color3.fromRGB(231, 76, 60)
leaveButton.Text = "Leave Lobby"
leaveButton.TextColor3 = Color3.new(1, 1, 1)
leaveButton.TextSize = 16
leaveButton.Font = Enum.Font.GothamBold
leaveButton.BorderSizePixel = 0
leaveButton.Parent = buttonFrame

local corner9 = Instance.new("UICorner")
corner9.CornerRadius = UDim.new(0, 8)
corner9.Parent = leaveButton

-- Invite Button
local inviteButton = Instance.new("TextButton")
inviteButton.Name = "InviteButton"
inviteButton.Size = UDim2.new(0.48, 0, 0, 35)
inviteButton.Position = UDim2.new(0, 0, 0, 45)
inviteButton.BackgroundColor3 = Color3.fromRGB(155, 89, 182)
inviteButton.Text = "Invite Player"
inviteButton.TextColor3 = Color3.new(1, 1, 1)
inviteButton.TextSize = 16
inviteButton.Font = Enum.Font.GothamBold
inviteButton.BorderSizePixel = 0
inviteButton.Parent = buttonFrame

local corner10 = Instance.new("UICorner")
corner10.CornerRadius = UDim.new(0, 8)
corner10.Parent = inviteButton

-- Variables
local currentLobbyCode = nil
local isInLobby = false

-- Functions
local function updatePlayerList(players, isOwner)
	-- Clear existing list
	for _, child in ipairs(playerListFrame:GetChildren()) do
		if child:IsA("Frame") then
			child:Destroy()
		end
	end
	
	-- Add players
	for i, playerName in ipairs(players) do
		local playerItem = Instance.new("Frame")
		playerItem.Name = playerName
		playerItem.Size = UDim2.new(1, -10, 0, 35)
		playerItem.BackgroundColor3 = Color3.fromRGB(41, 128, 185)
		playerItem.BorderSizePixel = 0
		playerItem.Parent = playerListFrame
		
		local itemCorner = Instance.new("UICorner")
		itemCorner.CornerRadius = UDim.new(0, 6)
		itemCorner.Parent = playerItem
		
		local nameLabel = Instance.new("TextLabel")
		nameLabel.Size = UDim2.new(0.7, 0, 1, 0)
		nameLabel.BackgroundTransparency = 1
		nameLabel.Text = playerName
		nameLabel.TextColor3 = Color3.new(1, 1, 1)
		nameLabel.TextSize = 14
		nameLabel.Font = Enum.Font.Gotham
		nameLabel.TextXAlignment = Enum.TextXAlignment.Left
		nameLabel.Position = UDim2.new(0, 10, 0, 0)
		nameLabel.Parent = playerItem
		
		-- Add kick button if owner and not self
		if isOwner and playerName ~= player.Name then
			local kickBtn = Instance.new("TextButton")
			kickBtn.Name = "KickButton"
			kickBtn.Size = UDim2.new(0, 60, 0, 25)
			kickBtn.Position = UDim2.new(1, -70, 0.5, -12.5)
			kickBtn.BackgroundColor3 = Color3.fromRGB(231, 76, 60)
			kickBtn.Text = "Kick"
			kickBtn.TextColor3 = Color3.new(1, 1, 1)
			kickBtn.TextSize = 12
			kickBtn.Font = Enum.Font.GothamBold
			kickBtn.BorderSizePixel = 0
			kickBtn.Parent = playerItem
			
			local kickCorner = Instance.new("UICorner")
			kickCorner.CornerRadius = UDim.new(0, 4)
			kickCorner.Parent = kickBtn
			
			kickBtn.MouseButton1Click:Connect(function()
				KickPlayer:FireServer(playerName)
			end)
		end
	end
	
	playerListFrame.CanvasSize = UDim2.new(0, 0, 0, #players * 40)
end

-- Button Handlers
openButton.MouseButton1Click:Connect(function()
	lobbyFrame.Visible = not lobbyFrame.Visible
end)

closeButton.MouseButton1Click:Connect(function()
	lobbyFrame.Visible = false
end)

createJoinButton.MouseButton1Click:Connect(function()
	if isInLobby then
		-- Join with code
		local code = codeInput.Text
		if code and code ~= "" then
			JoinLobby:FireServer(code)
		end
	else
		-- Create new lobby
		CreateLobby:FireServer()
	end
end)

leaveButton.MouseButton1Click:Connect(function()
	if isInLobby then
		LeaveLobby:FireServer()
	end
end)

inviteButton.MouseButton1Click:Connect(function()
	if isInLobby and currentLobbyCode then
		-- Copy code to clipboard (show message)
		codeInput.Text = currentLobbyCode
		print("Lobby code:", currentLobbyCode)
	end
end)

-- Remote Event Handlers
UpdateLobbyUI.OnClientEvent:Connect(function(lobbyData)
	if lobbyData then
		isInLobby = true
		currentLobbyCode = lobbyData.Code
		codeLabel.Text = "Lobby Code: " .. lobbyData.Code
		updatePlayerList(lobbyData.Players, lobbyData.IsOwner)
		createJoinButton.Text = "Join Lobby"
		createJoinButton.BackgroundColor3 = Color3.fromRGB(52, 152, 219)
	else
		isInLobby = false
		currentLobbyCode = nil
		codeLabel.Text = "Lobby Code: ----"
		updatePlayerList({}, false)
		createJoinButton.Text = "Create Lobby"
		createJoinButton.BackgroundColor3 = Color3.fromRGB(46, 204, 113)
	end
end)

print("LobbyGui loaded successfully!")
