# Giant Clone Lobby System - Installation Guide

## Step-by-Step Installation for Roblox Studio

### Part 1: Workspace Setup

#### 1. Create the Lobby Button
1. In Roblox Studio, go to **Workspace**
2. Insert a new Part (Insert → Part)
3. Rename it to **"LobbyButton"**
4. Configure the part:
   - Set Color to bright red or any eye-catching color
   - Set Size to something like `6, 6, 6` (or any size you prefer)
   - Position it where players can easily find it
5. Insert a Script inside the LobbyButton part
6. Copy the contents from `Workspace/LobbyButtonScript.lua` into this script

#### 2. Create the Giant Spawn Location
1. In **Workspace**, insert another Part
2. Rename it to **"GiantSpawnPart"**
3. Configure the part:
   - Set Transparency to `1` (invisible)
   - Set CanCollide to `false`
   - Set Anchored to `true`
   - Position it where you want the giants to spawn
   - Make it large enough for multiple giants (recommend `20, 1, 20` or larger)
4. Insert a Script inside the GiantSpawnPart
5. Copy the contents from `Workspace/GiantSpawnScript.lua` into this script

### Part 2: ReplicatedStorage Setup

1. Go to **ReplicatedStorage** in the Explorer
2. Insert a new **RemoteEvent** (Insert → Remote Event)
3. Rename it to **"LobbyEvents"**
4. Insert another **RemoteEvent**
5. Rename it to **"GiantEvents"**

### Part 3: ServerScriptService Setup

1. Go to **ServerScriptService** in the Explorer
2. Insert a new **Script**
3. Rename it to **"LobbyManager"**
4. Copy the contents from `ServerScriptService/LobbyManager.lua` into this script
5. Insert another **Script**
6. Rename it to **"GiantController"**
7. Copy the contents from `ServerScriptService/ImprovedGiantController.lua` into this script

### Part 4: StarterGui Setup

#### Create the Lobby GUI
1. Go to **StarterGui** in the Explorer
2. Insert a new **ScreenGui** (Insert → Screen Gui)
3. Rename it to **"LobbyGui"**
4. Insert a **LocalScript** inside the LobbyGui
5. Rename it to **"LobbyGuiScript"**
6. Copy the contents from `StarterGui/LobbyGuiScript.lua` into this script

### Part 5: StarterPlayer Setup

1. Go to **StarterPlayer** in the Explorer
2. Open **StarterPlayerScripts** folder
3. Insert a new **LocalScript** (Insert → Local Script)
4. Rename it to **"GiantClientController"**
5. Copy the contents from `StarterPlayer/GiantClientController.lua` into this script

---

## Testing Your System

### Test in Studio
1. Click the **Play** button (or press F5)
2. Walk up to the **LobbyButton** in workspace
3. Press **E** or click on it to open the lobby menu
4. Click **"Create New Lobby"**
5. You should see:
   - A lobby code displayed
   - Your name in the players list
   - A giant clone of your character at the spawn location

### Test with Multiple Players
1. Click **Play** and select **2 Players** or more
2. Have Player 1 create a lobby
3. Have Player 2 press the lobby button and enter the code from Player 1
4. You should see:
   - Both players in the lobby
   - Multiple giant clones at the spawn location
   - Giants positioned in a formation (side by side for 2, circle for 3+)
   - Giants mimicking player animations

### Test Animation Mimicry
1. While in a lobby with giants visible:
   - Walk around (giants should mimic walking animation)
   - Jump (giants should mimic jumping)
   - Emote (giants should mimic emotes)
2. With 3+ players, the giants will blend all animations together

---

## Features Overview

### Lobby System Features
- ✅ **Physical Button** - Players must go to a specific location to create/join lobbies
- ✅ **Lobby Codes** - 6-character codes for easy sharing
- ✅ **Owner Controls** - Lobby creator can kick players
- ✅ **Player List** - See all players in your lobby
- ✅ **Leave/Kick** - Full lobby management

### Giant Clone Features
- ✅ **Visibility Control** - Giants only visible to lobby members
- ✅ **Animation Mimicry** - Giants copy all player animations in real-time
- ✅ **Scaling** - Giants are 3x larger than normal characters
- ✅ **Smart Positioning**:
  - 1 player: Giant at center
  - 2 players: Giants side by side
  - 3+ players: Giants in a circle formation
- ✅ **Fixed Spawn Location** - Giants always spawn at GiantSpawnPart

---

## Troubleshooting

### Giants Not Appearing
1. Check that **GiantSpawnPart** exists in Workspace
2. Check that **GiantController** script is running (check Output for "ImprovedGiantController loaded")
3. Make sure players have characters loaded before creating lobby

### GUI Not Opening
1. Check that **LobbyGui** exists in StarterGui
2. Check that **LobbyButton** has the script attached
3. Check that **RemoteEvents** exist in ReplicatedStorage

### Animations Not Syncing
1. Check that **GiantClientController** is running (check Output for "GiantClientController loaded")
2. Make sure your character has an Animator component
3. Check that giants are visible (only visible to lobby members)

### Kick Button Not Working
1. Only the lobby owner can kick players
2. You cannot kick yourself
3. Check that the LobbyManager script is running

---

## Customization Options

### Change Giant Size
In `ImprovedGiantController.lua`, find this line:
```lua
local scale = 3
```
Change `3` to any number (e.g., `5` for 5x size, `2` for 2x size)

### Change Giant Formation
In `ImprovedGiantController.lua`, find the `positionGiants` function and modify:
- `radius` - Distance from center for circle formation
- `offset` - Distance between giants in 2-player mode

### Change Lobby Code Length
In `LobbyManager.lua`, find this line:
```lua
for i = 1, 6 do
```
Change `6` to any number for different code length

### Change GUI Colors
In `LobbyGuiScript.lua`, modify the `Color3.fromRGB()` values for different colors

---

## Advanced Features

### Invite System
The lobby code acts as an invite system. Players can:
1. Share the code with friends
2. Friends enter the code in the join menu
3. Friends join the lobby instantly

### Kick System
Only the lobby owner can kick players:
1. Click the "Kick" button next to a player's name
2. That player is immediately removed from the lobby
3. Their giant clone disappears

### Animation Blending
With 3+ players, the system blends animations:
- All players' animations are combined
- Creates unique, synchronized movements
- Weight-balanced for smooth results

---

## Performance Notes

- **Maximum Players per Lobby**: 10 (can be changed in LobbyManager.lua)
- **Giant Count**: Equals player count in lobby
- **Animation Tracking**: Real-time, minimal performance impact
- **Recommended for**: Games with medium-sized servers (10-20 players)

---

## Support

If you encounter issues:
1. Check the **Output** window in Studio for error messages
2. Verify all scripts are in the correct locations
3. Make sure all RemoteEvents are properly named
4. Test with 1 player first before testing multiplayer

---

## Credits

Created for Roblox Studio
- Lobby Management System
- Giant Clone System
- Animation Mimicry System
- Client-Server Synchronization

Enjoy your giant clone lobby system! 🎮
