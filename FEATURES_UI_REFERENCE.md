# Chat Features UI Reference

## 🎨 Visual Guide to All Interactive Features

---

## 📱 Chat Window Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Avatar] John Doe (Online)          📞  📹  ⋮         │ ← Header
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Avatar] Hey! How are you?                             │ ← Other's Message
│           12:30 PM                                       │
│           👍 ❤️                                          │ ← Reactions
│                                                          │
│                              I'm good! Thanks! [Avatar]  │ ← Your Message
│                                        12:31 PM          │
│                                                          │
│  [Avatar] Check this file:                              │
│           [📄 document.pdf - 2.5 MB] [Download]         │ ← File Message
│                                                          │
│                              [🖼️ Image Preview] [Avatar] │ ← Image Message
│                                                          │
├─────────────────────────────────────────────────────────┤
│  ↩️ Replying to John: "Hey! How are you?"        [X]   │ ← Reply Bar
├─────────────────────────────────────────────────────────┤
│  📎  [Type a message...]                          📤    │ ← Input Area
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Message Actions (On Hover)

When you hover over ANY message, action buttons appear:

```
┌──────────────────────────────────────────────────────┐
│  😊  ↩️  ➡️  ✏️  🗑️  ⋮                              │ ← Action Buttons
└──────────────────────────────────────────────────────┘
│  [Avatar] This is a message                          │
│           12:30 PM                                   │
└──────────────────────────────────────────────────────┘

😊 = React (add emoji)
↩️ = Reply
➡️ = Forward
✏️ = Edit (only your messages)
🗑️ = Delete (only your messages)
⋮ = More options
```

---

## 😊 Emoji Picker

Click the smile icon on any message:

```
┌────────────────────────────────┐
│  👍  ❤️  😂  😮  😢  🙏      │ ← Quick Reactions
└────────────────────────────────┘
```

Click any emoji to add it to the message. Multiple users can react!

---

## 📎 Attach Menu

Click the paperclip icon in the message input:

```
┌─────────────────────────┐
│  📷 Photo/Video         │
│  📄 Document            │
│  🎤 Audio               │
└─────────────────────────┘
```

---

## ⋮ More Menu (Chat Header)

Click the three dots in the chat header:

```
┌─────────────────────────┐
│  ⚙️ Chat Settings       │
│  🔕 Mute Chat           │
│  🗑️ Clear Chat          │
└─────────────────────────┘
```

---

## 🎨 Chat Settings Modal

Click "Chat Settings" from More menu:

```
┌──────────────────────────────────────────────┐
│  Chat Settings                          [X]  │
├──────────────────────────────────────────────┤
│                                              │
│  Background Theme                            │
│                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐          │
│  │Default │ │  Dark  │ │  Blue  │          │
│  │   ✓    │ │        │ │        │          │
│  └────────┘ └────────┘ └────────┘          │
│                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐          │
│  │ Green  │ │ Purple │ │  Pink  │          │
│  └────────┘ └────────┘ └────────┘          │
│                                              │
│  Custom Background                           │
│  [📷 Upload Image]                          │
│                                              │
│  [Preview of uploaded image]                 │
│  [Remove]                                    │
│                                              │
├──────────────────────────────────────────────┤
│                              [Done]          │
└──────────────────────────────────────────────┘
```

---

## 📞 Voice/Video Call Interface

Click phone or video icon in chat header:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                                                 │
│              [Remote Video Feed]                │
│                                                 │
│         ┌──────────────┐                       │
│         │ Local Video  │ ← Your camera         │
│         │   Preview    │   (top-right)         │
│         └──────────────┘                       │
│                                                 │
│                                                 │
│         🎤    📹    🖥️    📞                   │
│        Mic  Camera Share  End                  │
│                                                 │
└─────────────────────────────────────────────────┘

Controls:
🎤 = Toggle Microphone (on/off)
📹 = Toggle Camera (on/off) - video calls only
🖥️ = Screen Share
📞 = End Call (red button)
```

---

## ✏️ Edit Message Mode

Click edit button on your message:

```
┌──────────────────────────────────────────────┐
│  [Input: "This is my edited message..."]    │
│  [Cancel]  [Save]                            │
└──────────────────────────────────────────────┘
```

Type your changes and click Save or press Enter.

---

## 💬 Reply Bar

Click reply on any message:

```
┌──────────────────────────────────────────────┐
│  ↩️ Replying to John Doe              [X]   │
│     "Hey! How are you?"                      │
└──────────────────────────────────────────────┘
│  📎  [Type your reply...]             📤    │
└──────────────────────────────────────────────┘
```

---

## 📄 File Message Display

When someone sends a file:

### Image Files:
```
┌──────────────────────────────┐
│  [Avatar] John Doe           │
│                              │
│  ┌────────────────────────┐ │
│  │                        │ │
│  │   [Image Preview]      │ │
│  │                        │ │
│  └────────────────────────┘ │
│  Optional caption text       │
│  12:30 PM                    │
└──────────────────────────────┘
```

### Document Files:
```
┌──────────────────────────────────────┐
│  [Avatar] John Doe                   │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ 📄  document.pdf               │ │
│  │     2.5 MB                     │ │
│  │                   [Download]   │ │
│  └────────────────────────────────┘ │
│  12:30 PM                            │
└──────────────────────────────────────┘
```

---

## 🎨 Background Themes Preview

### Default (Light Gray)
- Clean, professional look
- Easy on the eyes
- Default chat background

### Dark
- Dark gray/black background
- Perfect for night mode
- Reduces eye strain

### Blue
- Light blue tint
- Calm and professional
- Good for long conversations

### Green
- Light green tint
- Fresh and natural
- Relaxing atmosphere

### Purple
- Light purple tint
- Creative and unique
- Stands out

### Pink
- Light pink tint
- Warm and friendly
- Soft appearance

### Custom
- Upload your own image
- Personal touch
- Any image you like

---

## 🎯 Feature Locations Quick Reference

| Feature | Location | Icon/Button |
|---------|----------|-------------|
| Voice Call | Chat Header | 📞 |
| Video Call | Chat Header | 📹 |
| More Menu | Chat Header | ⋮ |
| Chat Settings | More Menu | ⚙️ |
| Attach File | Message Input | 📎 |
| Send Message | Message Input | 📤 |
| React to Message | Hover on Message | 😊 |
| Reply to Message | Hover on Message | ↩️ |
| Forward Message | Hover on Message | ➡️ |
| Edit Message | Hover on Message (yours) | ✏️ |
| Delete Message | Hover on Message (yours) | 🗑️ |

---

## 💡 Pro Tips

1. **Quick Reactions**: Hover and click smile icon for instant emoji reactions
2. **Fast Reply**: Click reply button to quote and respond quickly
3. **Edit Mistakes**: Made a typo? Just hover and click edit
4. **Custom Backgrounds**: Make it yours with a custom background image
5. **File Sharing**: Drag and drop files or use the attach menu
6. **Multi-React**: Multiple people can react to the same message
7. **Real-Time**: All actions update instantly for all users
8. **Persistent Settings**: Your background choice is saved automatically

---

## 🎨 Color Scheme

- **Primary Blue**: #0084ff (buttons, links, your messages)
- **Light Gray**: #f0f2f5 (backgrounds, inputs)
- **Dark Gray**: #65676b (secondary text)
- **White**: #ffffff (message bubbles, modals)
- **Red**: #f02849 (delete, end call)
- **Green**: Online status indicators

---

## 📱 Responsive Design

All features work on:
- ✅ Desktop (1920x1080 and above)
- ✅ Laptop (1366x768 and above)
- ✅ Tablet (768px and above)
- ✅ Mobile (320px and above)

---

## ⌨️ Keyboard Shortcuts

- **Enter** - Send message
- **Enter** (while editing) - Save edited message
- **Escape** (while editing) - Cancel edit
- **Escape** (reply bar) - Cancel reply

---

This is your complete visual reference for all interactive features! 🎉
