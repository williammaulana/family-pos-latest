-- LobbyUI.lua
-- UI system for lobby management

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- Wait for remote events
local lobbyEvents = ReplicatedStorage:WaitForChild("LobbyEvents")
local createLobbyEvent = lobbyEvents:WaitForChild("CreateLobby")
local joinLobbyEvent = lobbyEvents:WaitForChild("JoinLobby")
local leaveLobbyEvent = lobbyEvents:WaitForChild("LeaveLobby")
local kickPlayerEvent = lobbyEvents:WaitForChild("KickPlayer")
local invitePlayerEvent = lobbyEvents:WaitForChild("InvitePlayer")

-- Create main GUI
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "LobbyGUI"
screenGui.Parent = playerGui

-- Main lobby button
local lobbyButton = Instance.new("TextButton")
lobbyButton.Name = "LobbyButton"
lobbyButton.Size = UDim2.new(0, 200, 0, 50)
lobbyButton.Position = UDim2.new(0, 10, 0, 10)
lobbyButton.BackgroundColor3 = Color3.new(0.2, 0.6, 1)
lobbyButton.BorderSizePixel = 0
lobbyButton.Text = "Open Lobby"
lobbyButton.TextColor3 = Color3.new(1, 1, 1)
lobbyButton.TextSize = 18
lobbyButton.Font = Enum.Font.SourceSansBold
lobbyButton.Parent = screenGui

-- Add corner rounding
local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 8)
corner.Parent = lobbyButton

-- Lobby panel (initially hidden)
local lobbyPanel = Instance.new("Frame")
lobbyPanel.Name = "LobbyPanel"
lobbyPanel.Size = UDim2.new(0, 400, 0, 500)
lobbyPanel.Position = UDim2.new(0.5, -200, 0.5, -250)
lobbyPanel.BackgroundColor3 = Color3.new(0.1, 0.1, 0.1)
lobbyPanel.BorderSizePixel = 0
lobbyPanel.Visible = false
lobbyPanel.Parent = screenGui

-- Add corner rounding to panel
local panelCorner = Instance.new("UICorner")
panelCorner.CornerRadius = UDim.new(0, 12)
panelCorner.Parent = lobbyPanel

-- Panel title
local titleLabel = Instance.new("TextLabel")
titleLabel.Name = "TitleLabel"
titleLabel.Size = UDim2.new(1, 0, 0, 40)
titleLabel.Position = UDim2.new(0, 0, 0, 0)
titleLabel.BackgroundTransparency = 1
titleLabel.Text = "Lobby System"
titleLabel.TextColor3 = Color3.new(1, 1, 1)
titleLabel.TextSize = 24
titleLabel.Font = Enum.Font.SourceSansBold
titleLabel.Parent = lobbyPanel

-- Close button
local closeButton = Instance.new("TextButton")
closeButton.Name = "CloseButton"
closeButton.Size = UDim2.new(0, 30, 0, 30)
closeButton.Position = UDim2.new(1, -40, 0, 5)
closeButton.BackgroundColor3 = Color3.new(0.8, 0.2, 0.2)
closeButton.BorderSizePixel = 0
closeButton.Text = "X"
closeButton.TextColor3 = Color3.new(1, 1, 1)
closeButton.TextSize = 18
closeButton.Font = Enum.Font.SourceSansBold
closeButton.Parent = lobbyPanel

local closeCorner = Instance.new("UICorner")
closeCorner.CornerRadius = UDim.new(0, 15)
closeCorner.Parent = closeButton

-- Lobby code display
local codeFrame = Instance.new("Frame")
codeFrame.Name = "CodeFrame"
codeFrame.Size = UDim2.new(1, -20, 0, 60)
codeFrame.Position = UDim2.new(0, 10, 0, 50)
codeFrame.BackgroundColor3 = Color3.new(0.2, 0.2, 0.2)
codeFrame.BorderSizePixel = 0
codeFrame.Parent = lobbyPanel

local codeCorner = Instance.new("UICorner")
codeCorner.CornerRadius = UDim.new(0, 8)
codeCorner.Parent = codeFrame

local codeLabel = Instance.new("TextLabel")
codeLabel.Name = "CodeLabel"
codeLabel.Size = UDim2.new(0.5, 0, 1, 0)
codeLabel.Position = UDim2.new(0, 0, 0, 0)
codeLabel.BackgroundTransparency = 1
codeLabel.Text = "Lobby Code:"
codeLabel.TextColor3 = Color3.new(1, 1, 1)
codeLabel.TextSize = 16
codeLabel.Font = Enum.Font.SourceSans
codeLabel.TextXAlignment = Enum.TextXAlignment.Left
codeLabel.Parent = codeFrame

local codeValue = Instance.new("TextLabel")
codeValue.Name = "CodeValue"
codeValue.Size = UDim2.new(0.5, 0, 1, 0)
codeValue.Position = UDim2.new(0.5, 0, 0, 0)
codeValue.BackgroundTransparency = 1
codeValue.Text = "Not in lobby"
codeValue.TextColor3 = Color3.new(0, 1, 0)
codeValue.TextSize = 18
codeValue.Font = Enum.Font.SourceSansBold
codeValue.TextXAlignment = Enum.TextXAlignment.Right
codeValue.Parent = codeFrame

-- Player list
local playerListFrame = Instance.new("Frame")
playerListFrame.Name = "PlayerListFrame"
playerListFrame.Size = UDim2.new(1, -20, 0, 200)
playerListFrame.Position = UDim2.new(0, 10, 0, 120)
playerListFrame.BackgroundColor3 = Color3.new(0.2, 0.2, 0.2)
playerListFrame.BorderSizePixel = 0
playerListFrame.Parent = lobbyPanel

local playerListCorner = Instance.new("UICorner")
playerListCorner.CornerRadius = UDim.new(0, 8)
playerListCorner.Parent = playerListFrame

local playerListLabel = Instance.new("TextLabel")
playerListLabel.Name = "PlayerListLabel"
playerListLabel.Size = UDim2.new(1, 0, 0, 30)
playerListLabel.Position = UDim2.new(0, 0, 0, 0)
playerListLabel.BackgroundTransparency = 1
playerListLabel.Text = "Players in Lobby:"
playerListLabel.TextColor3 = Color3.new(1, 1, 1)
playerListLabel.TextSize = 16
playerListLabel.Font = Enum.Font.SourceSansBold
playerListLabel.Parent = playerListFrame

local playerList = Instance.new("ScrollingFrame")
playerList.Name = "PlayerList"
playerList.Size = UDim2.new(1, -10, 1, -40)
playerList.Position = UDim2.new(0, 5, 0, 35)
playerList.BackgroundTransparency = 1
playerList.BorderSizePixel = 0
playerList.ScrollBarThickness = 6
playerList.Parent = playerListFrame

-- Buttons frame
local buttonsFrame = Instance.new("Frame")
buttonsFrame.Name = "ButtonsFrame"
buttonsFrame.Size = UDim2.new(1, -20, 0, 120)
buttonsFrame.Position = UDim2.new(0, 10, 0, 330)
buttonsFrame.BackgroundTransparency = 1
buttonsFrame.Parent = lobbyPanel

-- Create lobby button
local createLobbyBtn = Instance.new("TextButton")
createLobbyBtn.Name = "CreateLobbyBtn"
createLobbyBtn.Size = UDim2.new(0.48, 0, 0, 40)
createLobbyBtn.Position = UDim2.new(0, 0, 0, 0)
createLobbyBtn.BackgroundColor3 = Color3.new(0.2, 0.8, 0.2)
createLobbyBtn.BorderSizePixel = 0
createLobbyBtn.Text = "Create Lobby"
createLobbyBtn.TextColor3 = Color3.new(1, 1, 1)
createLobbyBtn.TextSize = 16
createLobbyBtn.Font = Enum.Font.SourceSansBold
createLobbyBtn.Parent = buttonsFrame

local createCorner = Instance.new("UICorner")
createCorner.CornerRadius = UDim.new(0, 8)
createCorner.Parent = createLobbyBtn

-- Join lobby button
local joinLobbyBtn = Instance.new("TextButton")
joinLobbyBtn.Name = "JoinLobbyBtn"
joinLobbyBtn.Size = UDim2.new(0.48, 0, 0, 40)
joinLobbyBtn.Position = UDim2.new(0.52, 0, 0, 0)
joinLobbyBtn.BackgroundColor3 = Color3.new(0.2, 0.4, 0.8)
joinLobbyBtn.BorderSizePixel = 0
joinLobbyBtn.Text = "Join Lobby"
joinLobbyBtn.TextColor3 = Color3.new(1, 1, 1)
joinLobbyBtn.TextSize = 16
joinLobbyBtn.Font = Enum.Font.SourceSansBold
joinLobbyBtn.Parent = buttonsFrame

local joinCorner = Instance.new("UICorner")
joinCorner.CornerRadius = UDim.new(0, 8)
joinCorner.Parent = joinLobbyBtn

-- Leave lobby button
local leaveLobbyBtn = Instance.new("TextButton")
leaveLobbyBtn.Name = "LeaveLobbyBtn"
leaveLobbyBtn.Size = UDim2.new(0.48, 0, 0, 40)
leaveLobbyBtn.Position = UDim2.new(0, 0, 0, 50)
leaveLobbyBtn.BackgroundColor3 = Color3.new(0.8, 0.2, 0.2)
leaveLobbyBtn.BorderSizePixel = 0
leaveLobbyBtn.Text = "Leave Lobby"
leaveLobbyBtn.TextColor3 = Color3.new(1, 1, 1)
leaveLobbyBtn.TextSize = 16
leaveLobbyBtn.Font = Enum.Font.SourceSansBold
leaveLobbyBtn.Parent = buttonsFrame

local leaveCorner = Instance.new("UICorner")
leaveCorner.CornerRadius = UDim.new(0, 8)
leaveCorner.Parent = leaveLobbyBtn

-- Invite button
local inviteBtn = Instance.new("TextButton")
inviteBtn.Name = "InviteBtn"
inviteBtn.Size = UDim2.new(0.48, 0, 0, 40)
inviteBtn.Position = UDim2.new(0.52, 0, 0, 50)
inviteBtn.BackgroundColor3 = Color3.new(0.8, 0.6, 0.2)
inviteBtn.BorderSizePixel = 0
inviteBtn.Text = "Invite Player"
inviteBtn.TextColor3 = Color3.new(1, 1, 1)
inviteBtn.TextSize = 16
inviteBtn.Font = Enum.Font.SourceSansBold
inviteBtn.Parent = buttonsFrame

local inviteCorner = Instance.new("UICorner")
inviteCorner.CornerRadius = UDim.new(0, 8)
inviteCorner.Parent = inviteBtn

-- Join code input
local joinCodeInput = Instance.new("TextBox")
joinCodeInput.Name = "JoinCodeInput"
joinCodeInput.Size = UDim2.new(1, 0, 0, 30)
joinCodeInput.Position = UDim2.new(0, 0, 0, 100)
joinCodeInput.BackgroundColor3 = Color3.new(0.3, 0.3, 0.3)
joinCodeInput.BorderSizePixel = 0
joinCodeInput.PlaceholderText = "Enter lobby code..."
joinCodeInput.Text = ""
joinCodeInput.TextColor3 = Color3.new(1, 1, 1)
joinCodeInput.TextSize = 16
joinCodeInput.Font = Enum.Font.SourceSans
joinCodeInput.Parent = buttonsFrame

local inputCorner = Instance.new("UICorner")
inputCorner.CornerRadius = UDim.new(0, 8)
inputCorner.Parent = joinCodeInput

-- State variables
local currentLobby = nil
local isLobbyOpen = false

-- Animation functions
local function animatePanel(visible)
    if visible then
        lobbyPanel.Visible = true
        lobbyPanel.Size = UDim2.new(0, 0, 0, 0)
        local tween = TweenService:Create(
            lobbyPanel,
            TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
            {Size = UDim2.new(0, 400, 0, 500)}
        )
        tween:Play()
    else
        local tween = TweenService:Create(
            lobbyPanel,
            TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
            {Size = UDim2.new(0, 0, 0, 0)}
        )
        tween:Play()
        tween.Completed:Connect(function()
            lobbyPanel.Visible = false
        end)
    end
end

-- Update player list
local function updatePlayerList(players)
    -- Clear existing list
    for _, child in pairs(playerList:GetChildren()) do
        if child:IsA("Frame") then
            child:Destroy()
        end
    end
    
    -- Add players to list
    for i, player in pairs(players) do
        local playerFrame = Instance.new("Frame")
        playerFrame.Name = "Player_" .. player.Name
        playerFrame.Size = UDim2.new(1, -10, 0, 30)
        playerFrame.Position = UDim2.new(0, 5, 0, (i-1) * 35)
        playerFrame.BackgroundColor3 = Color3.new(0.3, 0.3, 0.3)
        playerFrame.BorderSizePixel = 0
        playerFrame.Parent = playerList
        
        local playerCorner = Instance.new("UICorner")
        playerCorner.CornerRadius = UDim.new(0, 6)
        playerCorner.Parent = playerFrame
        
        local playerName = Instance.new("TextLabel")
        playerName.Name = "PlayerName"
        playerName.Size = UDim2.new(0.7, 0, 1, 0)
        playerName.Position = UDim2.new(0, 0, 0, 0)
        playerName.BackgroundTransparency = 1
        playerName.Text = player.Name
        playerName.TextColor3 = Color3.new(1, 1, 1)
        playerName.TextSize = 14
        playerName.Font = Enum.Font.SourceSans
        playerName.TextXAlignment = Enum.TextXAlignment.Left
        playerName.Parent = playerFrame
        
        -- Kick button (only for lobby creator)
        if currentLobby and currentLobby.creator.UserId == player.UserId then
            local kickBtn = Instance.new("TextButton")
            kickBtn.Name = "KickBtn"
            kickBtn.Size = UDim2.new(0.25, 0, 0.7, 0)
            kickBtn.Position = UDim2.new(0.75, 0, 0.15, 0)
            kickBtn.BackgroundColor3 = Color3.new(0.8, 0.2, 0.2)
            kickBtn.BorderSizePixel = 0
            kickBtn.Text = "Kick"
            kickBtn.TextColor3 = Color3.new(1, 1, 1)
            kickBtn.TextSize = 12
            kickBtn.Font = Enum.Font.SourceSansBold
            kickBtn.Parent = playerFrame
            
            local kickCorner = Instance.new("UICorner")
            kickCorner.CornerRadius = UDim.new(0, 4)
            kickCorner.Parent = kickBtn
            
            kickBtn.MouseButton1Click:Connect(function()
                kickPlayerEvent:FireServer(player.UserId)
            end)
        end
    end
    
    -- Update canvas size
    playerList.CanvasSize = UDim2.new(0, 0, 0, #players * 35)
end

-- Event handlers
lobbyButton.MouseButton1Click:Connect(function()
    isLobbyOpen = not isLobbyOpen
    animatePanel(isLobbyOpen)
end)

closeButton.MouseButton1Click:Connect(function()
    isLobbyOpen = false
    animatePanel(false)
end)

createLobbyBtn.MouseButton1Click:Connect(function()
    createLobbyEvent:FireServer()
end)

joinLobbyBtn.MouseButton1Click:Connect(function()
    local code = joinCodeInput.Text
    if code ~= "" then
        joinLobbyEvent:FireServer(code)
    end
end)

leaveLobbyBtn.MouseButton1Click:Connect(function()
    leaveLobbyEvent:FireServer()
end)

inviteBtn.MouseButton1Click:Connect(function()
    if currentLobby then
        -- Copy lobby code to clipboard (simplified)
        print("Lobby code: " .. currentLobby.code .. " - Share this with friends!")
    end
end)

-- Remote event handlers
createLobbyEvent.OnClientEvent:Connect(function(event, data)
    if event == "LobbyCreated" then
        currentLobby = {code = data, creator = player}
        codeValue.Text = data
        codeValue.TextColor3 = Color3.new(0, 1, 0)
        updatePlayerList({player})
    end
end)

joinLobbyEvent.OnClientEvent:Connect(function(event, success, message)
    if event == "JoinResult" then
        if success then
            print("Joined lobby: " .. message)
        else
            print("Failed to join: " .. message)
        end
    end
end)

leaveLobbyEvent.OnClientEvent:Connect(function(event)
    if event == "LeftLobby" then
        currentLobby = nil
        codeValue.Text = "Not in lobby"
        codeValue.TextColor3 = Color3.new(1, 0, 0)
        updatePlayerList({})
    end
end)

kickPlayerEvent.OnClientEvent:Connect(function(event, success, message)
    if event == "KickResult" then
        if success then
            print("Player kicked: " .. message)
        else
            print("Failed to kick: " .. message)
        end
    end
end)

print("Lobby UI loaded successfully!")