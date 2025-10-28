# Quick Start Guide - Giant Clone Lobby System

## 🚀 Installation in 5 Minutes

### Step 1: Create Remote Events (30 seconds)
1. Open **ReplicatedStorage**
2. Insert → **RemoteEvent** → Rename to **"LobbyEvents"**
3. Insert → **RemoteEvent** → Rename to **"GiantEvents"**

### Step 2: Create Workspace Objects (1 minute)
1. In **Workspace**, create a **Part** named **"LobbyButton"**
   - Make it visible (bright color, good size like 6x6x6)
   - Add a **Script** inside it
   - Copy `Workspace/LobbyButtonScript.lua` into the script

2. In **Workspace**, create a **Part** named **"GiantSpawnPart"**
   - Set Transparency = 1
   - Set CanCollide = false
   - Position where giants should spawn
   - Add a **Script** inside it
   - Copy `Workspace/GiantSpawnScript.lua` into the script

### Step 3: Add Server Scripts (1 minute)
1. In **ServerScriptService**, create these 3 scripts:

   **Script 1: "LobbyManager"**
   - Copy from `ServerScriptService/LobbyManager.lua`

   **Script 2: "GiantController"**
   - Copy from `ServerScriptService/ImprovedGiantController.lua`

   **Script 3: "LobbyGiantIntegration"**
   - Copy from `ServerScriptService/LobbyGiantIntegration.lua`

### Step 4: Add GUI (1 minute)
1. In **StarterGui**, create a **ScreenGui** named **"LobbyGui"**
2. Add a **LocalScript** inside it named **"LobbyGuiScript"**
3. Copy from `StarterGui/LobbyGuiScript.lua`

### Step 5: Add Client Controller (30 seconds)
1. In **StarterPlayer** → **StarterPlayerScripts**
2. Create a **LocalScript** named **"GiantClientController"**
3. Copy from `StarterPlayer/GiantClientController.lua`

---

## ✅ Quick Test

1. Press **Play** (or F5)
2. Walk to the **LobbyButton**
3. Press **E** or click it
4. Click **"Create New Lobby"**
5. You should see a giant clone of yourself! 🎉

---

## 📁 File Structure

```
ReplicatedStorage
  ├── LobbyEvents (RemoteEvent)
  └── GiantEvents (RemoteEvent)

ServerScriptService
  ├── LobbyManager (Script)
  ├── GiantController (Script)
  └── LobbyGiantIntegration (Script)

StarterGui
  └── LobbyGui (ScreenGui)
      └── LobbyGuiScript (LocalScript)

StarterPlayer
  └── StarterPlayerScripts
      └── GiantClientController (LocalScript)

Workspace
  ├── LobbyButton (Part)
  │   └── Script
  └── GiantSpawnPart (Part)
      └── Script
```

---

## 🎮 How to Use

### Creating a Lobby
1. Press the **LobbyButton** in workspace
2. Click **"Create New Lobby"**
3. Share your **6-digit code** with friends

### Joining a Lobby
1. Press the **LobbyButton**
2. Enter the **6-digit code**
3. Click **"Join Lobby"**

### Managing Your Lobby
- **Kick Players**: Click the "Kick" button next to their name (owner only)
- **Leave Lobby**: Click "Leave Lobby"
- **Copy Code**: Click "Copy" to copy your lobby code

---

## 🎭 Giant Features

### What the Giants Do
- ✨ **3x Size** - Giants are 3 times larger than normal
- 🎪 **Animation Mimicry** - Copy every animation you do
- 👻 **Invisible to Others** - Only lobby members can see them
- 📍 **Fixed Spawn** - Always spawn at GiantSpawnPart

### Giant Formations
- **1 Player**: Giant stands at center
- **2 Players**: Giants stand side by side
- **3+ Players**: Giants form a cool circle, all facing center!

---

## 🐛 Common Issues

**Giants not appearing?**
- Check GiantSpawnPart exists in Workspace
- Check Output for error messages
- Make sure you're in a lobby

**GUI not opening?**
- Check LobbyGui exists in StarterGui
- Check RemoteEvents exist in ReplicatedStorage

**Can't kick players?**
- Only lobby owner can kick
- Can't kick yourself

---

## 🎨 Quick Customizations

### Make Giants Bigger/Smaller
In **GiantController**, find:
```lua
local scale = 3
```
Change to any number (e.g., 5 for huge, 2 for smaller)

### Change Button Color
Select the **LobbyButton** part and change its Color property

### Move Spawn Location
Just move the **GiantSpawnPart** to wherever you want!

---

## 💡 Pro Tips

1. **Better Visibility**: Place LobbyButton in a high-traffic area
2. **Spawn Height**: Place GiantSpawnPart slightly above ground for better effect
3. **Testing**: Use "2 Players" mode in Studio to test multiplayer
4. **Codes**: Codes are case-insensitive (ABC123 = abc123)

---

## 🎉 You're Done!

Your giant clone lobby system is ready! Players can now:
- Create lobbies at specific locations
- Invite friends with codes
- See giant clones that mimic their animations
- Enjoy cool formations with 3+ players

Have fun! 🚀
