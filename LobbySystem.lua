-- LobbySystem.lua
-- Main lobby system for giant clone feature

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

-- Create RemoteEvents
local remoteEvents = Instance.new("Folder")
remoteEvents.Name = "LobbyEvents"
remoteEvents.Parent = ReplicatedStorage

local createLobbyEvent = Instance.new("RemoteEvent")
createLobbyEvent.Name = "CreateLobby"
createLobbyEvent.Parent = remoteEvents

local joinLobbyEvent = Instance.new("RemoteEvent")
joinLobbyEvent.Name = "JoinLobby"
joinLobbyEvent.Parent = remoteEvents

local leaveLobbyEvent = Instance.new("RemoteEvent")
leaveLobbyEvent.Name = "LeaveLobby"
leaveLobbyEvent.Parent = remoteEvents

local kickPlayerEvent = Instance.new("RemoteEvent")
kickPlayerEvent.Name = "KickPlayer"
kickPlayerEvent.Parent = remoteEvents

local invitePlayerEvent = Instance.new("RemoteEvent")
invitePlayerEvent.Name = "InvitePlayer"
invitePlayerEvent.Parent = remoteEvents

-- Lobby data structure
local lobbies = {}
local playerLobbies = {}

-- Generate random lobby codes
local function generateLobbyCode()
    local chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    local code = ""
    for i = 1, 6 do
        local rand = math.random(1, #chars)
        code = code .. string.sub(chars, rand, rand)
    end
    return code
end

-- Create lobby
local function createLobby(creator)
    local lobbyCode = generateLobbyCode()
    local lobby = {
        code = lobbyCode,
        creator = creator,
        players = {creator},
        giantClone = nil,
        isActive = true
    }
    
    lobbies[lobbyCode] = lobby
    playerLobbies[creator.UserId] = lobbyCode
    
    -- Create giant clone
    createGiantClone(lobby)
    
    return lobby
end

-- Create giant clone
local function createGiantClone(lobby)
    local creator = lobby.creator
    local character = creator.Character
    if not character then return end
    
    local humanoid = character:FindFirstChild("Humanoid")
    if not humanoid then return end
    
    -- Create giant clone
    local giantClone = character:Clone()
    giantClone.Name = "GiantClone_" .. lobby.code
    giantClone.Parent = workspace
    
    -- Scale up the giant (3x size)
    local scale = 3
    for _, part in pairs(giantClone:GetChildren()) do
        if part:IsA("BasePart") then
            part.Size = part.Size * scale
            part.CanCollide = false
        elseif part:IsA("Accessory") then
            local handle = part:FindFirstChild("Handle")
            if handle then
                handle.Size = handle.Size * scale
                handle.CanCollide = false
            end
        end
    end
    
    -- Position giant above the ground
    local rootPart = giantClone:FindFirstChild("HumanoidRootPart")
    if rootPart then
        rootPart.CFrame = rootPart.CFrame + Vector3.new(0, 20, 0)
    end
    
    -- Remove humanoid to prevent AI behavior
    local giantHumanoid = giantClone:FindFirstChild("Humanoid")
    if giantHumanoid then
        giantHumanoid:Destroy()
    end
    
    -- Make giant only visible to lobby members
    local function updateVisibility()
        for _, player in pairs(Players:GetPlayers()) do
            local playerCharacter = player.Character
            if playerCharacter then
                local playerUserId = player.UserId
                local isInLobby = false
                
                for _, lobbyPlayer in pairs(lobby.players) do
                    if lobbyPlayer.UserId == playerUserId then
                        isInLobby = true
                        break
                    end
                end
                
                -- Set visibility for all parts
                for _, part in pairs(giantClone:GetChildren()) do
                    if part:IsA("BasePart") then
                        part.Transparency = isInLobby and 0 or 1
                    elseif part:IsA("Accessory") then
                        local handle = part:FindFirstChild("Handle")
                        if handle then
                            handle.Transparency = isInLobby and 0 or 1
                        end
                    end
                end
            end
        end
    end
    
    -- Update visibility when players join/leave
    local connection
    connection = Players.PlayerAdded:Connect(function(player)
        wait(1) -- Wait for character to load
        updateVisibility()
    end)
    
    Players.PlayerRemoving:Connect(function(player)
        updateVisibility()
    end)
    
    -- Initial visibility update
    updateVisibility()
    
    lobby.giantClone = giantClone
    
    -- Start animation mimicry
    startAnimationMimicry(lobby)
    
    -- Start cool positioning for 3+ players
    startCoolPositioning(lobby)
end

-- Animation mimicry system
local function startAnimationMimicry(lobby)
    local giantClone = lobby.giantClone
    if not giantClone then return end
    
    local giantRootPart = giantClone:FindFirstChild("HumanoidRootPart")
    if not giantRootPart then return end
    
    local function mimicAnimations()
        for _, player in pairs(lobby.players) do
            local character = player.Character
            if character then
                local humanoid = character:FindFirstChild("Humanoid")
                local rootPart = character:FindFirstChild("HumanoidRootPart")
                
                if humanoid and rootPart then
                    -- Get current animation
                    local currentAnimation = humanoid:GetPlayingAnimationTracks()
                    
                    -- Apply to giant (simplified - just copy root part rotation)
                    if #currentAnimation > 0 then
                        local animTrack = currentAnimation[1]
                        if animTrack then
                            -- Mirror the animation pose to giant
                            local animPose = animTrack:GetTimeOfKeyframe(animTrack.Length)
                            -- This is a simplified version - in practice you'd need to map all bones
                        end
                    end
                    
                    -- Copy basic movement
                    local targetCFrame = rootPart.CFrame
                    targetCFrame = targetCFrame + Vector3.new(0, 20, 0) -- Offset above ground
                    targetCFrame = targetCFrame * CFrame.new(0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1) -- Scale rotation
                    
                    -- Smooth movement
                    local tween = TweenService:Create(
                        giantRootPart,
                        TweenInfo.new(0.1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
                        {CFrame = targetCFrame}
                    )
                    tween:Play()
                end
            end
        end
    end
    
    -- Update every frame
    local connection
    connection = RunService.Heartbeat:Connect(mimicAnimations)
    
    -- Clean up when lobby is destroyed
    lobby.onDestroy = function()
        if connection then
            connection:Disconnect()
        end
    end
end

-- Cool positioning system for 3+ players
local function startCoolPositioning(lobby)
    local giantClone = lobby.giantClone
    if not giantClone then return end
    
    local giantRootPart = giantClone:FindFirstChild("HumanoidRootPart")
    if not giantRootPart then return end
    
    local function updateCoolPositioning()
        local playerCount = #lobby.players
        if playerCount < 3 then return end
        
        -- Create cool formation based on player count
        local centerPosition = Vector3.new(0, 20, 0)
        local radius = 10
        
        if playerCount >= 3 then
            -- Triangle formation
            local angleStep = (2 * math.pi) / playerCount
            for i, player in pairs(lobby.players) do
                local angle = (i - 1) * angleStep
                local offset = Vector3.new(
                    math.cos(angle) * radius,
                    0,
                    math.sin(angle) * radius
                )
                
                local character = player.Character
                if character then
                    local rootPart = character:FindFirstChild("HumanoidRootPart")
                    if rootPart then
                        local targetPosition = centerPosition + offset
                        rootPart.CFrame = CFrame.new(targetPosition, centerPosition)
                    end
                end
            end
            
            -- Position giant in center
            giantRootPart.CFrame = CFrame.new(centerPosition)
        end
    end
    
    -- Update positioning
    local connection
    connection = RunService.Heartbeat:Connect(updateCoolPositioning)
    
    -- Clean up when lobby is destroyed
    lobby.onDestroy = function()
        if connection then
            connection:Disconnect()
        end
    end
end

-- Join lobby
local function joinLobby(player, lobbyCode)
    local lobby = lobbies[lobbyCode]
    if not lobby or not lobby.isActive then
        return false, "Lobby not found or inactive"
    end
    
    if #lobby.players >= 8 then -- Max 8 players
        return false, "Lobby is full"
    end
    
    table.insert(lobby.players, player)
    playerLobbies[player.UserId] = lobbyCode
    
    return true, "Joined lobby successfully"
end

-- Leave lobby
local function leaveLobby(player)
    local lobbyCode = playerLobbies[player.UserId]
    if not lobbyCode then return end
    
    local lobby = lobbies[lobbyCode]
    if not lobby then return end
    
    -- Remove player from lobby
    for i, lobbyPlayer in pairs(lobby.players) do
        if lobbyPlayer.UserId == player.UserId then
            table.remove(lobby.players, i)
            break
        end
    end
    
    playerLobbies[player.UserId] = nil
    
    -- If no players left, destroy lobby
    if #lobby.players == 0 then
        if lobby.giantClone then
            lobby.giantClone:Destroy()
        end
        if lobby.onDestroy then
            lobby.onDestroy()
        end
        lobbies[lobbyCode] = nil
    end
end

-- Kick player
local function kickPlayer(kicker, targetUserId)
    local lobbyCode = playerLobbies[kicker.UserId]
    if not lobbyCode then return false, "You're not in a lobby" end
    
    local lobby = lobbies[lobbyCode]
    if not lobby then return false, "Lobby not found" end
    
    if lobby.creator.UserId ~= kicker.UserId then
        return false, "Only the lobby creator can kick players"
    end
    
    local targetPlayer = Players:GetPlayerByUserId(targetUserId)
    if not targetPlayer then return false, "Player not found" end
    
    leaveLobby(targetPlayer)
    return true, "Player kicked successfully"
end

-- Event handlers
createLobbyEvent.OnServerEvent:Connect(function(player)
    local lobby = createLobby(player)
    createLobbyEvent:FireClient(player, "LobbyCreated", lobby.code)
end)

joinLobbyEvent.OnServerEvent:Connect(function(player, lobbyCode)
    local success, message = joinLobby(player, lobbyCode)
    joinLobbyEvent:FireClient(player, "JoinResult", success, message)
end)

leaveLobbyEvent.OnServerEvent:Connect(function(player)
    leaveLobby(player)
    leaveLobbyEvent:FireClient(player, "LeftLobby")
end)

kickPlayerEvent.OnServerEvent:Connect(function(player, targetUserId)
    local success, message = kickPlayer(player, targetUserId)
    kickPlayerEvent:FireClient(player, "KickResult", success, message)
end)

-- Clean up when player leaves
Players.PlayerRemoving:Connect(function(player)
    leaveLobby(player)
end)

print("Lobby System loaded successfully!")