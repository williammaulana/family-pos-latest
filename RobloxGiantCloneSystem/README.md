# Giant Clone Lobby System for Roblox Studio

## Installation Instructions

### Workspace Setup
1. Create a **Part** in Workspace named "LobbyButton"
   - Set it to a visible color (e.g., bright red)
   - Add the script: `Workspace/LobbyButtonScript.lua`

2. Create a **Part** in Workspace named "GiantSpawnPart"
   - Position this where you want the giant to spawn
   - Make it invisible: Set Transparency to 1
   - Set CanCollide to false
   - Add the script: `Workspace/GiantSpawnScript.lua`

### ServerScriptService Setup
1. Create a **Script** named "LobbyManager" in ServerScriptService
   - Copy contents from: `ServerScriptService/LobbyManager.lua`

2. Create a **Script** named "GiantController" in ServerScriptService
   - Copy contents from: `ServerScriptService/GiantController.lua`

### StarterGui Setup
1. Create a **ScreenGui** named "LobbyGui" in StarterGui
   - Copy the GUI structure and script from: `StarterGui/LobbyGui/`

### ReplicatedStorage Setup
1. Create a **RemoteEvent** named "LobbyEvents" in ReplicatedStorage
2. Create a **RemoteEvent** named "GiantEvents" in ReplicatedStorage

### StarterPlayer Setup
1. Create a **LocalScript** in StarterPlayer > StarterPlayerScripts
   - Copy contents from: `StarterPlayer/GiantClientController.lua`

## Features
- Physical button in workspace to create/join lobbies
- Lobby system with invite, kick, and join code functionality
- Giant clone visible only to lobby members
- Animation mimicry from all players in the lobby
- Special positioning for 3+ players
- Giant spawns at designated location

## Usage
1. Press the LobbyButton in workspace to create a lobby
2. Share the lobby code with friends
3. Use invite/kick buttons to manage lobby
4. The giant will appear at the spawn location and mimic all player animations
5. Only lobby members can see the giant
