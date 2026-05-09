<div align="center">

<!-- Animated Banner -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=200&section=header&text=Student%20Story&fontSize=60&fontColor=fff&animation=fadeIn&fontAlignY=38&desc=One%20student.%20One%20story.%20Unfolding%20over%20time.&descAlignY=58&descSize=18" width="100%"/>

<!-- Badges Row 1 -->
<p>
  <img src="https://img.shields.io/badge/License-Custom%20Open-blueviolet?style=for-the-badge&logo=opensourceinitiative&logoColor=white" alt="License"/>
  <img src="https://img.shields.io/badge/Privacy-Local%20First-green?style=for-the-badge&logo=shieldsdotio&logoColor=white" alt="Privacy"/>
  <img src="https://img.shields.io/badge/Platform-Mobile%20%7C%20Tablet%20%7C%20Desktop-blue?style=for-the-badge&logo=devices&logoColor=white" alt="Platform"/>
  <img src="https://img.shields.io/badge/AI-Optional%20Coach-orange?style=for-the-badge&logo=openai&logoColor=white" alt="AI"/>
</p>

<!-- Badges Row 2 -->
<p>
  <img src="https://img.shields.io/badge/For-Teachers%20%26%20Educators-ff69b4?style=for-the-badge&logo=bookstack&logoColor=white" alt="For Teachers"/>
  <img src="https://img.shields.io/badge/Data-Stays%20On%20Your%20Device-teal?style=for-the-badge&logo=databricks&logoColor=white" alt="Data"/>
  <img src="https://img.shields.io/badge/Credit-Olufsen-yellow?style=for-the-badge&logo=github&logoColor=black" alt="Credit"/>
</p>

<br/>

> *"A calm, private space to remember each student — not a gradebook, not a district system, just **your** thread of moments and notes for **them**."*

<br/>

</div>

---

## 🌟 Why Student Story Exists

Teachers carry an **enormous amount of detail** in their heads — what happened in class last Tuesday, a breakthrough after lunch, a tricky conversation with home, a photo that captures genuine engagement.

**Student Story** gives each learner their own ongoing narrative so you can jot, speak, snap, or clip something short **in the moment** — without wrestling with spreadsheets or shared drives.

It is built around one simple idea:

<div align="center">

```
╔═══════════════════════════════════════╗
║   📖  ONE STUDENT.  ONE STORY.        ║
║        Unfolding over time.           ║
╚═══════════════════════════════════════╝
```

</div>

---

## ✨ What You Can Capture

Every entry can mix **text** with richer kinds of memory:

| Type | Icon | Description |
|------|------|-------------|
| **Written Notes** | 📝 | Quick reflections, observations, meeting reminders, or fuller write-ups when you have time |
| **Voice** | 🎙️ | Tap record when typing is awkward — your tone and pace stay part of the record |
| **Photos & Video** | 📸 | Evidence of work, environment, or milestones you might want to revisit later |
| **Captions** | 💬 | Add context under images or clips so future-you knows *why* something mattered |

After you **finish** a voice note, the app runs **speech-to-text in the browser** (Whisper via [Transformers.js](https://huggingface.co/docs/transformers.js)) and saves the transcript as that clip’s **description** (caption). On **saved** entries, tap **Transcribe** under the player to append more text to the same caption. The **first** transcription downloads model weights over the network (on the order of tens of MB); **Safari / Firefox / older devices** may be slower or fail, in which case the audio note still saves.

> The layout feels familiar — like a **conversation with yourself** about that student — so adding something small doesn't feel like "doing paperwork."

---

## 🔒 Built for Privacy & Trust

<div align="center">

```
 🏠 Your Device          🚫 No Silent Uploads     📤 You Choose
 is Home Base            Data stays local          what leaves
     │                         │                        │
     ▼                         ▼                        ▼
  Everything            No third-party           Export backup
  lives with            monetisation              files anytime
    you                 of school data            on your terms
```

</div>

- 🏠 **Your device is home base** — what you save lives with you on the phone, tablet, or laptop where you use the app
- 🚫 **Nothing ships out silently** — no platform quietly monetising school data
- 📤 **You choose what leaves** — export a backup file whenever you're ready
- ⭐ **Favourites & blocking** — star students for quick access, or pause new entries while keeping history intact

> Student Story is for professionals who already protect confidentiality every day. The app tries to stay out of the way and **honour that responsibility**.

---

## 👤 Profiles & Organisation

Each student gets their own simple **profile**:

```
┌─────────────────────────────────────────────┐
│  📷 [Photo]   Jamie Doe                     │
│               Class 4B · Spring Term        │
│  ─────────────────────────────────────────  │
│  📌 Notes: Works well with visual prompts   │
│            Guardian: Alex Doe               │
│  ─────────────────────────────────────────  │
│  📖 Story Thread ↓                         │
│     Mar 12 · "Great moment during reading" │
│     Mar 08 · Voice note after parent call  │
│     Mar 05 · Photo of project work         │
└─────────────────────────────────────────────┘
```

Everything is **chronological, readable, and easy to skim back through** before a meeting or a new term.

---

## 🤖 Optional AI Coach

Sometimes it helps to step back and ask:

> *"What patterns am I noticing? What might I try next?"*

<div align="center">

| Feature | Detail |
|---------|--------|
| 🔍 **Reads only your data** | Looks only at what you've already stored for that student |
| 🚫 **Can't change your logs** | It cannot rewrite or modify any of your files |
| 💡 **Suggests, never decides** | Summaries, questions, ideas — you judge and act |
| 🔧 **Fully optional** | Turn it off and the rest of the app works exactly the same |

</div>

> The AI coach is a **thinking partner**, not an authority. You stay in control.

---

## 👩‍🏫 Who It's For

<div align="center">

```
🏫 Classroom        🎓 Learning        👥 Mentors &        🌱 Anyone who needs
   Teachers            Support Staff      Support Staff       a private, human-
                                                              sized record per
                                                              learner
```

</div>

Student Story is **not** a replacement for official reporting tools — it's a **companion** for the everyday story of growth, struggle, and small wins.

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/student-story.git

# Navigate into the project
cd student-story

# Install dependencies
npm install

# Run the app
npm start
```

> **Install note:** `@xenova/transformers` lists `sharp` as a dependency for Node-side tooling. If `npm install` fails building native code on your machine, use `npm install --ignore-scripts`; the browser app does not need `sharp` at runtime.

> 📌 Replace `YOUR_USERNAME` with your GitHub handle.

---

## 📁 Project Structure

```
student-story/
├── 📂 src/
│   ├── 📂 components/      # UI components
│   ├── 📂 screens/         # App screens
│   ├── 📂 storage/         # Local data layer
│   └── 📂 ai/              # Optional AI coach integration
├── 📂 assets/              # Icons, fonts, images
├── 📄 LICENSE              # Licensing terms
└── 📄 README.md            # You are here
```

---

## 📜 License & Sharing

<div align="center">

![License Badge](https://img.shields.io/badge/Use%20It-✔️-brightgreen?style=flat-square)
![Change It](https://img.shields.io/badge/Change%20It-✔️-brightgreen?style=flat-square)
![Share It](https://img.shields.io/badge/Share%20It-✔️-brightgreen?style=flat-square)
![Sell It](https://img.shields.io/badge/Sell%20It-✔️-brightgreen?style=flat-square)

</div>

You are welcome to **use, change, share, and even sell** work derived from Student Story.

**Two simple asks:**
1. 🙏 **Credit Olufsen** as the original creator
2. 🔗 **Include a link to this repository** so others can find the source

Full terms are in the [`LICENSE`](LICENSE) file.

---

## 🙌 Contributing

Contributions, issues, and feature requests are welcome!

<div align="center">

[![Issues](https://img.shields.io/github/issues/Haroon966/Student-Story?style=for-the-badge&color=red)](https://github.com/Haroon966/Student-Story/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/Haroon966/Student-Story?style=for-the-badge&color=blue)](https://github.com/Haroon966/Student-Story/pulls)
[![Stars](https://img.shields.io/github/stars/Haroon966/Student-Story?style=for-the-badge&color=yellow)](https://github.com/Haroon966/Student-Story/stargazers)

</div>

</div>

1. 🍴 Fork the project
2. 🌿 Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. 💾 Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. 📤 Push to the branch (`git push origin feature/AmazingFeature`)
5. 🔃 Open a Pull Request

---

## 💬 In Short

<div align="center">

> **Student Story** helps you honour the narrative of each child:
> capture honestly, store locally, reflect when you're ready —
> and keep the thread of their story in one trustworthy place.

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=120&section=footer&animation=fadeIn" width="100%"/>

<br/>

Made with ❤️ by **[Olufsen](https://github.com/YOUR_USERNAME)**

</div>