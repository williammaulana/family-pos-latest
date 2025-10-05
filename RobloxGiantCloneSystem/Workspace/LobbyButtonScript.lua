-- Lobby Button Script
-- Place this script inside the LobbyButton part in Workspace

local button = script.Parent
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

-- Make the button clickable
local clickDetector = button:FindFirstChild("ClickDetector")
if not clickDetector then
	clickDetector = Instance.new("ClickDetector")
	clickDetector.Parent = button
	clickDetector.MaxActivationDistance = 10
end

-- Add a proximity prompt for better UX
local proximityPrompt = button:FindFirstChild("ProximityPrompt")
if not proximityPrompt then
	proximityPrompt = Instance.new("ProximityPrompt")
	proximityPrompt.Parent = button
	proximityPrompt.ActionText = "Open Lobby Menu"
	proximityPrompt.ObjectText = "Lobby System"
	proximityPrompt.MaxActivationDistance = 10
	proximityPrompt.RequiresLineOfSight = false
end

-- Handle button press
proximityPrompt.Triggered:Connect(function(player)
	-- Fire the GUI to open
	local lobbyGui = player:WaitForChild("PlayerGui"):FindFirstChild("LobbyGui")
	if lobbyGui then
		lobbyGui.Enabled = true
		
		-- Request lobby info from server
		local lobbyEvents = ReplicatedStorage:WaitForChild("LobbyEvents")
		lobbyEvents:FireServer("GetLobbyInfo")
	end
end)

-- Also support click detector for backwards compatibility
clickDetector.MouseClick:Connect(function(player)
	local lobbyGui = player:WaitForChild("PlayerGui"):FindFirstChild("LobbyGui")
	if lobbyGui then
		lobbyGui.Enabled = true
		
		local lobbyEvents = ReplicatedStorage:WaitForChild("LobbyEvents")
		lobbyEvents:FireServer("GetLobbyInfo")
	end
end)

-- Visual feedback
local TweenService = game:GetService("TweenService")
local originalSize = button.Size
local originalColor = button.Color

proximityPrompt.PromptShown:Connect(function()
	local tween = TweenService:Create(
		button,
		TweenInfo.new(0.3, Enum.EasingStyle.Bounce, Enum.EasingDirection.Out),
		{Size = originalSize * 1.2, Color = Color3.fromRGB(100, 255, 100)}
	)
	tween:Play()
end)

proximityPrompt.PromptHidden:Connect(function()
	local tween = TweenService:Create(
		button,
		TweenInfo.new(0.3, Enum.EasingStyle.Bounce, Enum.EasingDirection.Out),
		{Size = originalSize, Color = originalColor}
	)
	tween:Play()
end)

print("LobbyButton script loaded")
