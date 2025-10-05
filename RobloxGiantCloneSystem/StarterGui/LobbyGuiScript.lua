-- Lobby GUI Script
-- Place this LocalScript inside the LobbyGui ScreenGui in StarterGui

local gui = script.Parent
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")
local player = Players.LocalPlayer

-- Wait for remote events
local lobbyEvents = ReplicatedStorage:WaitForChild("LobbyEvents")

-- GUI State
local currentLobbyInfo = nil

-- Create GUI Elements
local mainFrame = Instance.new("Frame")
mainFrame.Name = "MainFrame"
mainFrame.Size = UDim2.new(0, 400, 0, 500)
mainFrame.Position = UDim2.new(0.5, -200, 0.5, -250)
mainFrame.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
mainFrame.BorderSizePixel = 0
mainFrame.Parent = gui

-- Add rounded corners
local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 12)
corner.Parent = mainFrame

-- Title
local title = Instance.new("TextLabel")
title.Name = "Title"
title.Size = UDim2.new(1, 0, 0, 50)
title.Position = UDim2.new(0, 0, 0, 0)
title.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
title.BorderSizePixel = 0
title.Text = "Lobby System"
title.TextColor3 = Color3.fromRGB(255, 255, 255)
title.TextSize = 24
title.Font = Enum.Font.GothamBold
title.Parent = mainFrame

local titleCorner = Instance.new("UICorner")
titleCorner.CornerRadius = UDim.new(0, 12)
titleCorner.Parent = title

-- Close button
local closeButton = Instance.new("TextButton")
closeButton.Name = "CloseButton"
closeButton.Size = UDim2.new(0, 40, 0, 40)
closeButton.Position = UDim2.new(1, -45, 0, 5)
closeButton.BackgroundColor3 = Color3.fromRGB(200, 50, 50)
closeButton.BorderSizePixel = 0
closeButton.Text = "X"
closeButton.TextColor3 = Color3.fromRGB(255, 255, 255)
closeButton.TextSize = 20
closeButton.Font = Enum.Font.GothamBold
closeButton.Parent = mainFrame

local closeCorner = Instance.new("UICorner")
closeCorner.CornerRadius = UDim.new(0, 8)
closeCorner.Parent = closeButton

-- Menu Frame (shown when not in lobby)
local menuFrame = Instance.new("Frame")
menuFrame.Name = "MenuFrame"
menuFrame.Size = UDim2.new(1, -40, 1, -90)
menuFrame.Position = UDim2.new(0, 20, 0, 70)
menuFrame.BackgroundTransparency = 1
menuFrame.Parent = mainFrame

-- Create Lobby Button
local createButton = Instance.new("TextButton")
createButton.Name = "CreateButton"
createButton.Size = UDim2.new(1, 0, 0, 60)
createButton.Position = UDim2.new(0, 0, 0, 20)
createButton.BackgroundColor3 = Color3.fromRGB(50, 150, 50)
createButton.BorderSizePixel = 0
createButton.Text = "Create New Lobby"
createButton.TextColor3 = Color3.fromRGB(255, 255, 255)
createButton.TextSize = 20
createButton.Font = Enum.Font.GothamBold
createButton.Parent = menuFrame

local createCorner = Instance.new("UICorner")
createCorner.CornerRadius = UDim.new(0, 10)
createCorner.Parent = createButton

-- Join Lobby Section
local joinLabel = Instance.new("TextLabel")
joinLabel.Name = "JoinLabel"
joinLabel.Size = UDim2.new(1, 0, 0, 40)
joinLabel.Position = UDim2.new(0, 0, 0, 100)
joinLabel.BackgroundTransparency = 1
joinLabel.Text = "Join Lobby with Code:"
joinLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
joinLabel.TextSize = 18
joinLabel.Font = Enum.Font.Gotham
joinLabel.TextXAlignment = Enum.TextXAlignment.Left
joinLabel.Parent = menuFrame

local codeInput = Instance.new("TextBox")
codeInput.Name = "CodeInput"
codeInput.Size = UDim2.new(1, 0, 0, 50)
codeInput.Position = UDim2.new(0, 0, 0, 140)
codeInput.BackgroundColor3 = Color3.fromRGB(60, 60, 60)
codeInput.BorderSizePixel = 0
codeInput.PlaceholderText = "Enter 6-digit code"
codeInput.Text = ""
codeInput.TextColor3 = Color3.fromRGB(255, 255, 255)
codeInput.TextSize = 18
codeInput.Font = Enum.Font.GothamBold
codeInput.Parent = menuFrame

local codeCorner = Instance.new("UICorner")
codeCorner.CornerRadius = UDim.new(0, 10)
codeCorner.Parent = codeInput

local joinButton = Instance.new("TextButton")
joinButton.Name = "JoinButton"
joinButton.Size = UDim2.new(1, 0, 0, 60)
joinButton.Position = UDim2.new(0, 0, 0, 210)
joinButton.BackgroundColor3 = Color3.fromRGB(50, 100, 200)
joinButton.BorderSizePixel = 0
joinButton.Text = "Join Lobby"
joinButton.TextColor3 = Color3.fromRGB(255, 255, 255)
joinButton.TextSize = 20
joinButton.Font = Enum.Font.GothamBold
joinButton.Parent = menuFrame

local joinCorner = Instance.new("UICorner")
joinCorner.CornerRadius = UDim.new(0, 10)
joinCorner.Parent = joinButton

-- Lobby Frame (shown when in lobby)
local lobbyFrame = Instance.new("Frame")
lobbyFrame.Name = "LobbyFrame"
lobbyFrame.Size = UDim2.new(1, -40, 1, -90)
lobbyFrame.Position = UDim2.new(0, 20, 0, 70)
lobbyFrame.BackgroundTransparency = 1
lobbyFrame.Visible = false
lobbyFrame.Parent = mainFrame

-- Lobby Code Display
local lobbyCodeLabel = Instance.new("TextLabel")
lobbyCodeLabel.Name = "LobbyCodeLabel"
lobbyCodeLabel.Size = UDim2.new(1, 0, 0, 60)
lobbyCodeLabel.Position = UDim2.new(0, 0, 0, 0)
lobbyCodeLabel.BackgroundColor3 = Color3.fromRGB(60, 60, 60)
lobbyCodeLabel.BorderSizePixel = 0
lobbyCodeLabel.Text = "Lobby Code: XXXXXX"
lobbyCodeLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
lobbyCodeLabel.TextSize = 22
lobbyCodeLabel.Font = Enum.Font.GothamBold
lobbyCodeLabel.Parent = lobbyFrame

local codeDisplayCorner = Instance.new("UICorner")
codeDisplayCorner.CornerRadius = UDim.new(0, 10)
codeDisplayCorner.Parent = lobbyCodeLabel

-- Copy Code Button
local copyButton = Instance.new("TextButton")
copyButton.Name = "CopyButton"
copyButton.Size = UDim2.new(0, 80, 0, 40)
copyButton.Position = UDim2.new(1, -90, 0, 10)
copyButton.BackgroundColor3 = Color3.fromRGB(100, 100, 100)
copyButton.BorderSizePixel = 0
copyButton.Text = "Copy"
copyButton.TextColor3 = Color3.fromRGB(255, 255, 255)
copyButton.TextSize = 16
copyButton.Font = Enum.Font.GothamBold
copyButton.Parent = lobbyCodeLabel

local copyCorner = Instance.new("UICorner")
copyCorner.CornerRadius = UDim.new(0, 8)
copyCorner.Parent = copyButton

-- Players List
local playersLabel = Instance.new("TextLabel")
playersLabel.Name = "PlayersLabel"
playersLabel.Size = UDim2.new(1, 0, 0, 30)
playersLabel.Position = UDim2.new(0, 0, 0, 70)
playersLabel.BackgroundTransparency = 1
playersLabel.Text = "Players in Lobby:"
playersLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
playersLabel.TextSize = 18
playersLabel.Font = Enum.Font.GothamBold
playersLabel.TextXAlignment = Enum.TextXAlignment.Left
playersLabel.Parent = lobbyFrame

local playersScrollFrame = Instance.new("ScrollingFrame")
playersScrollFrame.Name = "PlayersScrollFrame"
playersScrollFrame.Size = UDim2.new(1, 0, 0, 200)
playersScrollFrame.Position = UDim2.new(0, 0, 0, 105)
playersScrollFrame.BackgroundColor3 = Color3.fromRGB(50, 50, 50)
playersScrollFrame.BorderSizePixel = 0
playersScrollFrame.ScrollBarThickness = 6
playersScrollFrame.Parent = lobbyFrame

local scrollCorner = Instance.new("UICorner")
scrollCorner.CornerRadius = UDim.new(0, 10)
scrollCorner.Parent = playersScrollFrame

local listLayout = Instance.new("UIListLayout")
listLayout.SortOrder = Enum.SortOrder.LayoutOrder
listLayout.Padding = UDim.new(0, 5)
listLayout.Parent = playersScrollFrame

-- Leave Lobby Button
local leaveButton = Instance.new("TextButton")
leaveButton.Name = "LeaveButton"
leaveButton.Size = UDim2.new(1, 0, 0, 50)
leaveButton.Position = UDim2.new(0, 0, 1, -60)
leaveButton.BackgroundColor3 = Color3.fromRGB(200, 50, 50)
leaveButton.BorderSizePixel = 0
leaveButton.Text = "Leave Lobby"
leaveButton.TextColor3 = Color3.fromRGB(255, 255, 255)
leaveButton.TextSize = 18
leaveButton.Font = Enum.Font.GothamBold
leaveButton.Parent = lobbyFrame

local leaveCorner = Instance.new("UICorner")
leaveCorner.CornerRadius = UDim.new(0, 10)
leaveCorner.Parent = leaveButton

-- Status message
local statusLabel = Instance.new("TextLabel")
statusLabel.Name = "StatusLabel"
statusLabel.Size = UDim2.new(1, 0, 0, 30)
statusLabel.Position = UDim2.new(0, 0, 1, -20)
statusLabel.BackgroundTransparency = 1
statusLabel.Text = ""
statusLabel.TextColor3 = Color3.fromRGB(255, 200, 50)
statusLabel.TextSize = 14
statusLabel.Font = Enum.Font.Gotham
statusLabel.Parent = mainFrame

-- Functions
local function showStatus(message, isError)
	statusLabel.Text = message
	statusLabel.TextColor3 = isError and Color3.fromRGB(255, 100, 100) or Color3.fromRGB(100, 255, 100)
	task.wait(3)
	statusLabel.Text = ""
end

local function updatePlayersList()
	-- Clear existing players
	for _, child in ipairs(playersScrollFrame:GetChildren()) do
		if child:IsA("Frame") then
			child:Destroy()
		end
	end
	
	if not currentLobbyInfo then return end
	
	-- Add players
	for i, plr in ipairs(currentLobbyInfo.players) do
		local playerFrame = Instance.new("Frame")
		playerFrame.Name = "Player_" .. plr.Name
		playerFrame.Size = UDim2.new(1, -10, 0, 40)
		playerFrame.BackgroundColor3 = Color3.fromRGB(70, 70, 70)
		playerFrame.BorderSizePixel = 0
		playerFrame.Parent = playersScrollFrame
		
		local playerCorner = Instance.new("UICorner")
		playerCorner.CornerRadius = UDim.new(0, 8)
		playerCorner.Parent = playerFrame
		
		local playerLabel = Instance.new("TextLabel")
		playerLabel.Size = UDim2.new(1, -50, 1, 0)
		playerLabel.Position = UDim2.new(0, 10, 0, 0)
		playerLabel.BackgroundTransparency = 1
		playerLabel.Text = plr.Name .. (currentLobbyInfo.owner == plr.Name and " (Owner)" or "")
		playerLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
		playerLabel.TextSize = 16
		playerLabel.Font = Enum.Font.Gotham
		playerLabel.TextXAlignment = Enum.TextXAlignment.Left
		playerLabel.Parent = playerFrame
		
		-- Kick button (only for owner and not self)
		if currentLobbyInfo.isOwner and plr.Name ~= player.Name then
			local kickButton = Instance.new("TextButton")
			kickButton.Name = "KickButton"
			kickButton.Size = UDim2.new(0, 60, 0, 30)
			kickButton.Position = UDim2.new(1, -70, 0.5, -15)
			kickButton.BackgroundColor3 = Color3.fromRGB(200, 50, 50)
			kickButton.BorderSizePixel = 0
			kickButton.Text = "Kick"
			kickButton.TextColor3 = Color3.fromRGB(255, 255, 255)
			kickButton.TextSize = 14
			kickButton.Font = Enum.Font.GothamBold
			kickButton.Parent = playerFrame
			
			local kickCorner = Instance.new("UICorner")
			kickCorner.CornerRadius = UDim.new(0, 6)
			kickCorner.Parent = kickButton
			
			kickButton.MouseButton1Click:Connect(function()
				lobbyEvents:FireServer("KickPlayer", {playerName = plr.Name})
			end)
		end
	end
	
	playersScrollFrame.CanvasSize = UDim2.new(0, 0, 0, listLayout.AbsoluteContentSize.Y + 10)
end

local function showLobbyScreen()
	menuFrame.Visible = false
	lobbyFrame.Visible = true
	
	if currentLobbyInfo then
		lobbyCodeLabel.Text = "Lobby Code: " .. currentLobbyInfo.code
		updatePlayersList()
	end
end

local function showMenuScreen()
	menuFrame.Visible = true
	lobbyFrame.Visible = false
	currentLobbyInfo = nil
end

-- Button handlers
closeButton.MouseButton1Click:Connect(function()
	gui.Enabled = false
end)

createButton.MouseButton1Click:Connect(function()
	lobbyEvents:FireServer("CreateLobby")
	createButton.Text = "Creating..."
end)

joinButton.MouseButton1Click:Connect(function()
	local code = codeInput.Text:upper()
	if #code ~= 6 then
		showStatus("Code must be 6 characters", true)
		return
	end
	
	lobbyEvents:FireServer("JoinLobby", {code = code})
	joinButton.Text = "Joining..."
end)

copyButton.MouseButton1Click:Connect(function()
	if currentLobbyInfo then
		setclipboard(currentLobbyInfo.code)
		showStatus("Code copied to clipboard!", false)
	end
end)

leaveButton.MouseButton1Click:Connect(function()
	lobbyEvents:FireServer("LeaveLobby")
end)

-- Handle server responses
lobbyEvents.OnClientEvent:Connect(function(action, data)
	if action == "LobbyCreated" then
		currentLobbyInfo = data
		showLobbyScreen()
		showStatus("Lobby created successfully!", false)
		createButton.Text = "Create New Lobby"
		
	elseif action == "LobbyJoined" then
		currentLobbyInfo = data
		showLobbyScreen()
		showStatus("Joined lobby successfully!", false)
		joinButton.Text = "Join Lobby"
		codeInput.Text = ""
		
	elseif action == "LobbyInfo" then
		currentLobbyInfo = data
		showLobbyScreen()
		
	elseif action == "NoLobby" then
		showMenuScreen()
		
	elseif action == "LobbyLeft" then
		showMenuScreen()
		showStatus("Left lobby", false)
		
	elseif action == "PlayerJoined" then
		if currentLobbyInfo then
			currentLobbyInfo.players = data.players
			currentLobbyInfo.playerCount = data.playerCount
			updatePlayersList()
			showStatus(data.player .. " joined the lobby", false)
		end
		
	elseif action == "PlayerLeft" then
		if currentLobbyInfo then
			currentLobbyInfo.players = data.players
			currentLobbyInfo.playerCount = data.playerCount
			currentLobbyInfo.owner = data.newOwner
			currentLobbyInfo.isOwner = (data.newOwner == player.Name)
			updatePlayersList()
			showStatus(data.player .. " left the lobby", false)
		end
		
	elseif action == "Error" then
		showStatus(data, true)
		createButton.Text = "Create New Lobby"
		joinButton.Text = "Join Lobby"
	end
end)

-- Start with GUI disabled
gui.Enabled = false

print("LobbyGui script loaded")
