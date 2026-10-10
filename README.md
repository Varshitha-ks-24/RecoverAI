# RecoverAI 🔎
### AI-Assisted Intelligent Data Recovery and Digital Evidence Reconstruction

RecoverAI is an AI-assisted digital forensics prototype designed to analyze file fragments, identify suspicious patterns, visualize relationships between digital evidence, and support file reconstruction workflows.

Developed during the **CalmStacks 24-Hour Hackathon** at Malnad College of Engineering, RecoverAI explores how artificial intelligence and data analysis can support investigators in understanding fragmented or potentially corrupted digital data.

> **Our vision:** Turn fragmented digital traces into structured, interpretable evidence that can support forensic investigation.

---

## 🚀 Key Features

- **📊 Forensic Dashboard** — View dataset summaries, fragment statistics, file classifications, and reconstruction results.
- **🧩 Fragment Analysis** — Analyze file fragments using content patterns and extracted features.
- **🤖 AI-Based Classification** — Use Random Forest classification to estimate fragment file types.
- **🚨 Anomaly Detection** — Apply Isolation Forest to identify potentially unusual fragments for further examination.
- **🔐 Integrity Analysis** — Use SHA-256 hashing to support integrity checks and identify matching content.
- **🔗 Evidence Relationship Graph** — Visualize relationships and similarities between analyzed fragments.
- **🛠️ File Reconstruction Workflow** — Explore the reconstruction of compatible fragments into candidate files.
- **📝 Audit Log** — Maintain a record of investigation actions to support traceability.
- **📁 Dataset Analysis** — Process demonstration data and uploaded files through the analysis workflow.

*Note: Classification, anomaly scores, and similarity relationships are investigative indicators, not proof that a file is malicious or that two fragments belong together.*

## 🧠 AI Pipeline

RecoverAI brings together several analysis stages:

1. **Input processing** — Accept supported demonstration datasets or uploaded files.
2. **Fragment and feature extraction** — Extract characteristics such as fragment size, entropy, byte-frequency patterns, printable-character ratios, and file-signature indicators.
3. **Random Forest classification** — Estimate file types using extracted features.
4. **Isolation Forest analysis** — Calculate anomaly scores for potentially unusual fragments.
5. **Integrity and similarity analysis** — Use SHA-256 hashes and similarity-related features to identify potential matches.
6. **Relationship analysis** — Represent candidate relationships in an evidence graph.
7. **Investigator review** — Present analysis results and reconstruction candidates for human examination.

## 🖥️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, JavaScript |
| Backend | Python, FastAPI |
| Machine Learning | scikit-learn, Random Forest, Isolation Forest |
| Data Visualization | Interactive evidence relationship graph |
| Data Integrity | SHA-256 hashing |
| API | REST API |

## 🏗️ Project Structure

```text
RecoverAI/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py
│   │   └── services/
│   │       ├── ai_pipeline.py
│   │       ├── demo_data_generator.py
│   │       └── fragment_analyzer.py
│   └── tests/
│       └── test_ai_pipeline.py
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── context/
│       └── pages/
├── PROJECT_GUIDE.md
└── README.md
```

*The structure above highlights the main files visible in the project. Other files and directories may also be present.*

## ⚙️ Getting Started

### Prerequisites

- Python 3.10 or a compatible version supported by the project's dependencies
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Varshitha-ks-24/RecoverAI.git
cd RecoverAI
```

### 2. Set up the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Start the API:

```bash
python3 -m uvicorn app.main:app --reload --port 8001
```

Once running, the FastAPI documentation is normally available at:

`http://127.0.0.1:8001/docs`

### 3. Set up the frontend

Open a new terminal and navigate to the frontend directory:

```bash
cd RecoverAI/frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal.

**Before publishing:** Verify the dependency file names, Python version, frontend scripts, and API configuration against the current repository. If the backend does not contain `requirements.txt`, use the dependency installation instructions already defined by the project.

## 🔒 Responsible Digital Forensics

RecoverAI is intended to support forensic analysis, not replace expert judgment.

- Use only files and devices you own or are authorized to examine.
- Preserve original evidence and work on copies wherever possible.
- Treat model predictions and reconstruction results as candidates requiring verification.
- Do not interpret anomaly scores as definitive proof of malicious activity.
- Validate reconstructed files before treating them as reliable evidence.

## 🎯 Project Goals

- Explore practical applications of AI in digital forensics.
- Investigate file fragments using machine-learning techniques.
- Improve the visibility of relationships between digital artifacts.
- Support structured review of integrity, anomalies, and reconstruction candidates.
- Build an extensible prototype for future forensic research and development.

## 🔮 Future Enhancements

- Broader file-format and fragment support.
- More robust fragment-matching and reconstruction algorithms.
- Improved evaluation using labeled forensic datasets.
- Stronger integrity verification and evidence provenance.
- Enhanced reporting and exportable investigation summaries.
- Expanded automated testing and validation.

## 🏆 Hackathon

**Event:** CalmStacks 24-Hour Hackathon  
**Organized by:** Department of Computer Science and Engineering, Malnad College of Engineering  
**Dates:** September 25–26, 2026  
**Track:** Cybersecurity & AI

The project was developed as an exploration of AI-assisted data recovery and digital evidence reconstruction under hackathon time constraints.

## 👩‍💻 Author

**Varshitha K S**

Artificial Intelligence and Data Science Engineering Student

GitHub: [@Varshitha-ks-24](https://github.com/Varshitha-ks-24)

---

*RecoverAI — Explore the fragments. Discover the connections. Support the investigation.*
