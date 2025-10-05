-- Giant Client Controller Script
-- Place this LocalScript in StarterPlayer > StarterPlayerScripts
-- Handles giant visibility and animation mimicry

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local player = Players.LocalPlayer
local giantEvents = ReplicatedStorage:WaitForChild("GiantEvents")
local lobbyEvents = ReplicatedStorage:WaitForChild("LobbyEvents")

-- Track lobby state
local currentLobby = nil
local visibleGiants = {}
local animationTracks = {}

-- Animation tracking for each player
local playerAnimations = {}

-- Function to make giant parts visible/invisible
local function setGiantVisibility(giantModel, visible)
	if not giantModel then return end
	
	for _, part in ipairs(giantModel:GetDescendants()) do
		if part:IsA("BasePart") then
			if visible then
				-- Restore original transparency
				part.Transparency = part.Name == "HumanoidRootPart" and 1 or 0
			else
				part.Transparency = 1
			end
		elseif part:IsA("Decal") or part:IsA("Texture") then
			part.Transparency = visible and 0 or 1
		end
	end
end

-- Function to track player animations
local function trackPlayerAnimations(targetPlayer)
	if not targetPlayer or not targetPlayer.Character then return end
	
	local character = targetPlayer.Character
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if not humanoid then return end
	
	local animator = humanoid:FindFirstChildOfClass("Animator")
	if not animator then return end
	
	-- Store animation info for this player
	playerAnimations[targetPlayer.UserId] = {
		player = targetPlayer,
		character = character,
		humanoid = humanoid,
		animator = animator,
		currentTracks = {}
	}
	
	-- Monitor animation tracks
	local function onAnimationPlayed(track)
		if not playerAnimations[targetPlayer.UserId] then return end
		
		local animInfo = playerAnimations[targetPlayer.UserId]
		animInfo.currentTracks[track.Animation.AnimationId] = {
			track = track,
			weight = track.WeightCurrent,
			speed = track.Speed,
			timePosition = track.TimePosition,
			isPlaying = track.IsPlaying
		}
		
		-- Clean up when animation stops
		track.Stopped:Connect(function()
			if animInfo.currentTracks[track.Animation.AnimationId] then
				animInfo.currentTracks[track.Animation.AnimationId] = nil
			end
		end)
	end
	
	animator.AnimationPlayed:Connect(onAnimationPlayed)
	
	-- Track existing animations
	for _, track in ipairs(humanoid:GetPlayingAnimationTracks()) do
		onAnimationPlayed(track)
	end
end

-- Function to sync animations from player to giant
local function syncAnimationsToGiant(giantModel, sourcePlayer)
	if not giantModel or not sourcePlayer then return end
	
	local giantHumanoid = giantModel:FindFirstChildOfClass("Humanoid")
	if not giantHumanoid then return end
	
	local giantAnimator = giantHumanoid:FindFirstChildOfClass("Animator")
	if not giantAnimator then
		giantAnimator = Instance.new("Animator")
		giantAnimator.Parent = giantHumanoid
	end
	
	local playerAnimInfo = playerAnimations[sourcePlayer.UserId]
	if not playerAnimInfo then
		trackPlayerAnimations(sourcePlayer)
		playerAnimInfo = playerAnimations[sourcePlayer.UserId]
	end
	
	if not playerAnimInfo then return end
	
	-- Store giant's animation tracks
	local giantKey = giantModel.Name
	if not animationTracks[giantKey] then
		animationTracks[giantKey] = {}
	end
	
	-- Sync animation loop
	local connection = RunService.Heartbeat:Connect(function()
		if not giantModel.Parent or not playerAnimInfo.character.Parent then
			connection:Disconnect()
			return
		end
		
		-- Sync each playing animation
		for animId, animData in pairs(playerAnimInfo.currentTracks) do
			if animData.isPlaying then
				local giantTrack = animationTracks[giantKey][animId]
				
				-- Load animation if not already loaded
				if not giantTrack then
					local success, result = pcall(function()
						return giantAnimator:LoadAnimation(animData.track.Animation)
					end)
					
					if success then
						giantTrack = result
						animationTracks[giantKey][animId] = giantTrack
					end
				end
				
				-- Play and sync the animation
				if giantTrack then
					if not giantTrack.IsPlaying then
						giantTrack:Play()
					end
					
					-- Sync properties
					giantTrack.TimePosition = animData.track.TimePosition
					giantTrack:AdjustSpeed(animData.speed)
					giantTrack:AdjustWeight(animData.weight)
				end
			else
				-- Stop animation if it stopped on player
				local giantTrack = animationTracks[giantKey][animId]
				if giantTrack and giantTrack.IsPlaying then
					giantTrack:Stop()
				end
			end
		end
	end)
	
	-- Store connection for cleanup
	if not animationTracks[giantKey].connections then
		animationTracks[giantKey].connections = {}
	end
	table.insert(animationTracks[giantKey].connections, connection)
end

-- Function to create blended animation for multiple players
local function createBlendedAnimation(giantModel, lobbyPlayers)
	if not giantModel or #lobbyPlayers == 0 then return end
	
	local giantHumanoid = giantModel:FindFirstChildOfClass("Humanoid")
	if not giantHumanoid then return end
	
	local giantAnimator = giantHumanoid:FindFirstChildOfClass("Animator")
	if not giantAnimator then
		giantAnimator = Instance.new("Animator")
		giantAnimator.Parent = giantHumanoid
	end
	
	local giantKey = giantModel.Name
	if not animationTracks[giantKey] then
		animationTracks[giantKey] = {}
	end
	
	-- Blend animations from all players
	local connection = RunService.Heartbeat:Connect(function()
		if not giantModel.Parent then
			connection:Disconnect()
			return
		end
		
		local activeAnimations = {}
		local playerCount = 0
		
		-- Collect all animations from all players
		for _, lobbyPlayer in ipairs(lobbyPlayers) do
			local playerAnimInfo = playerAnimations[lobbyPlayer.UserId]
			if playerAnimInfo and playerAnimInfo.character.Parent then
				playerCount = playerCount + 1
				for animId, animData in pairs(playerAnimInfo.currentTracks) do
					if animData.isPlaying then
						if not activeAnimations[animId] then
							activeAnimations[animId] = {
								track = animData.track,
								weight = 0,
								speed = animData.speed,
								timePosition = animData.track.TimePosition,
								count = 0
							}
						end
						activeAnimations[animId].weight = activeAnimations[animId].weight + animData.weight
						activeAnimations[animId].count = activeAnimations[animId].count + 1
					end
				end
			end
		end
		
		-- Apply blended animations to giant
		for animId, animData in pairs(activeAnimations) do
			local giantTrack = animationTracks[giantKey][animId]
			
			-- Load animation if not already loaded
			if not giantTrack then
				local success, result = pcall(function()
					return giantAnimator:LoadAnimation(animData.track.Animation)
				end)
				
				if success then
					giantTrack = result
					animationTracks[giantKey][animId] = giantTrack
				end
			end
			
			-- Play and sync the animation with blended weight
			if giantTrack then
				if not giantTrack.IsPlaying then
					giantTrack:Play()
				end
				
				-- Average the weight across all players
				local blendedWeight = playerCount > 0 and (animData.weight / playerCount) or animData.weight
				giantTrack:AdjustWeight(blendedWeight)
				giantTrack:AdjustSpeed(animData.speed)
				
				-- Use average time position
				giantTrack.TimePosition = animData.timePosition
			end
		end
	end)
	
	-- Store connection for cleanup
	if not animationTracks[giantKey].connections then
		animationTracks[giantKey].connections = {}
	end
	table.insert(animationTracks[giantKey].connections, connection)
end

-- Function to setup giants for the lobby
local function setupGiants(giantNames, lobbyPlayers)
	-- Clean up old giants
	for _, connection in ipairs(animationTracks) do
		if connection.connections then
			for _, conn in ipairs(connection.connections) do
				conn:Disconnect()
			end
		end
	end
	animationTracks = {}
	visibleGiants = {}
	
	-- Track all lobby players' animations
	for _, lobbyPlayer in ipairs(lobbyPlayers) do
		if lobbyPlayer.Character then
			trackPlayerAnimations(lobbyPlayer)
		end
		
		-- Track when player character respawns
		lobbyPlayer.CharacterAdded:Connect(function()
			wait(1) -- Wait for character to fully load
			trackPlayerAnimations(lobbyPlayer)
		end)
	end
	
	-- Setup each giant
	for i, giantName in ipairs(giantNames) do
		local giant = workspace:WaitForChild(giantName, 5)
		if giant then
			-- Make giant visible
			setGiantVisibility(giant, true)
			table.insert(visibleGiants, giant)
			
			-- Sync animations based on player count
			if #lobbyPlayers == 1 then
				-- Single player - direct animation sync
				syncAnimationsToGiant(giant, lobbyPlayers[1])
			elseif #lobbyPlayers == 2 then
				-- Two players - each giant mimics one player
				if lobbyPlayers[i] then
					syncAnimationsToGiant(giant, lobbyPlayers[i])
				end
			else
				-- 3+ players - blend all animations
				createBlendedAnimation(giant, lobbyPlayers)
			end
		end
	end
end

-- Handle giant creation events from server
giantEvents.OnClientEvent:Connect(function(action, data)
	if action == "GiantsCreated" then
		currentLobby = data.lobbyCode
		
		-- Get lobby info to know who's in the lobby
		lobbyEvents:FireServer("GetLobbyInfo")
		
		-- Wait a bit for lobby info response
		wait(0.5)
		
		-- For now, setup giants with available players
		-- This will be properly synced when we receive lobby updates
		local lobbyPlayers = {}
		for _, p in ipairs(Players:GetPlayers()) do
			if p.Character then
				table.insert(lobbyPlayers, p)
			end
		end
		
		setupGiants(data.giants, lobbyPlayers)
	end
end)

-- Handle lobby updates to keep giant animations in sync
lobbyEvents.OnClientEvent:Connect(function(action, data)
	if action == "LobbyInfo" or action == "PlayerJoined" or action == "PlayerLeft" then
		if data.players and currentLobby then
			-- Update giant animations with current lobby players
			if #visibleGiants > 0 then
				local lobbyPlayers = data.players
				-- Re-setup animation syncing
				for _, giant in ipairs(visibleGiants) do
					if #lobbyPlayers <= 2 then
						-- Find corresponding player for this giant
						local giantIndex = string.match(giant.Name, "%d+")
						if giantIndex then
							local playerIndex = tonumber(giantIndex)
							if lobbyPlayers[playerIndex] then
								syncAnimationsToGiant(giant, lobbyPlayers[playerIndex])
							end
						end
					end
				end
			end
		end
	elseif action == "LobbyLeft" then
		-- Clean up giants
		for _, giant in ipairs(visibleGiants) do
			setGiantVisibility(giant, false)
		end
		visibleGiants = {}
		currentLobby = nil
		
		-- Clean up animation tracking
		for _, connection in pairs(animationTracks) do
			if connection.connections then
				for _, conn in ipairs(connection.connections) do
					conn:Disconnect()
				end
			end
		end
		animationTracks = {}
		playerAnimations = {}
	end
end)

-- Hide all giants initially
workspace.ChildAdded:Connect(function(child)
	if child.Name:match("^GiantClone_") then
		-- Wait a frame for the giant to fully load
		task.wait()
		
		-- Check if this giant should be visible
		local shouldBeVisible = false
		for _, giant in ipairs(visibleGiants) do
			if giant == child then
				shouldBeVisible = true
				break
			end
		end
		
		if not shouldBeVisible then
			setGiantVisibility(child, false)
		end
	end
end)

print("GiantClientController loaded successfully")
