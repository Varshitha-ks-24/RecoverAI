# RecoverAI Project Guide

RecoverAI is a web-based prototype for AI-assisted data recovery and digital evidence reconstruction. It analyzes fragmented data, classifies fragments, discovers relationships between fragments, builds reconstruction candidates, scores confidence, checks integrity, and records investigator actions in an audit trail.

The project is designed for uploaded files and synthetic demonstration data. It does not access live devices, crack passwords, recover credentials, or decrypt protected content.

## Project Goals

RecoverAI helps an investigator answer:

- What type of file might each fragment belong to?
- Which fragments are duplicates, suspicious, corrupted, or decoys?
- Which fragments are likely related and can be ordered into a candidate file?
- How confident is the reconstruction, and why?
- Does the reconstructed content match an expected integrity hash?
- What actions were taken during the investigation?

## High-Level Architecture

```text
Browser
  |
  | React UI and Axios requests to /api
  v
Vite development server :5173
  |
  | /api proxy during development
  v
FastAPI backend :8000
  |
  +-- SQLAlchemy ORM
  |     |
  |     +-- SQLite database
  |
  +-- Fragment analysis services
  +-- Relationship analysis services
  +-- Reconstruction engine
  +-- Audit logging
```

## Repository Structure

```text
RecoverAI/
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── main.py                 FastAPI application and startup hooks
│       ├── api/routes.py            Dataset, analysis, graph, and audit endpoints
│       ├── core/config.py           Environment-backed application settings
│       ├── core/database.py         SQLAlchemy engine, sessions, and DB setup
│       ├── models/models.py          Database entities and relationships
│       ├── services/
│       │   ├── demo_data_generator.py
│       │   ├── fragment_analyzer.py
│       │   ├── relationship_analyzer.py
│       │   └── reconstruction_engine.py
│       ├── ml/                      ML package boundary
│       ├── utils/                   Shared backend utilities
│       └── tests/                   Backend test location
│
└── frontend/
    ├── package.json                 Frontend dependencies and scripts
    ├── vite.config.js               Vite server and API proxy
    ├── index.html                   Browser entry document
    └── src/
        ├── main.jsx                 React entry point
        ├── App.jsx                  Router, layout, and dataset route resolver
        ├── index.css                Tailwind layers and application styles
        ├── components/Sidebar.jsx   Main navigation and quick statistics
        ├── context/DatasetContext.jsx
        ├── pages/
        │   ├── Dashboard.jsx
        │   ├── DatasetAnalysis.jsx
        │   ├── Fragments.jsx
        │   ├── Reconstructions.jsx
        │   ├── EvidenceGraph.jsx
        │   ├── AuditLog.jsx
        │   └── About.jsx
        └── utils/api.js              Axios client configured for /api
```

## Frontend

The frontend uses React 18, React Router, Vite, Tailwind CSS, Recharts, Axios, and Lucide icons.

### Complete technology stack

#### Application runtime and languages

| Technology | Version | Role |
|---|---:|---|
| JavaScript / JSX | ES modules | Frontend application code and React components |
| Python | 3.10+ recommended | Backend services, data processing, and API code |
| Node.js / npm | Current LTS recommended | Frontend dependency installation and build scripts |
| HTML5 | Browser standard | Frontend entry document and semantic structure |
| CSS | Browser standard | Global layout, theme variables, animations, and component styles |

#### Frontend dependencies

| Package | Version | Role |
|---|---:|---|
| React | 18.2 | Component-based user interface |
| React DOM | 18.2 | Mounts React into the browser document |
| React Router DOM | 6.20 | Client-side routing and navigation |
| Axios | 1.6 | HTTP client for backend API requests |
| Recharts | 2.10 | Dashboard charts and data visualizations |
| Lucide React | 0.294 | Accessible interface icons |
| clsx | 2.0 | Conditional CSS class composition |

#### Frontend development and styling tools

| Package | Version | Role |
|---|---:|---|
| Vite | 5.0 | Development server, module bundler, and production build tool |
| `@vitejs/plugin-react` | 4.2 | React support for Vite |
| Tailwind CSS | 3.3 | Utility classes and theme configuration |
| PostCSS | 8.4 | CSS transformation pipeline |
| Autoprefixer | 10.4 | Adds browser-compatible CSS prefixes |
| `@types/react` | 18.2 | React editor and type metadata |
| `@types/react-dom` | 18.2 | React DOM editor and type metadata |

Tailwind theme configuration defines the RecoverAI color palette, dark interface colors, display typography, monospace typography, and content scanning paths. PostCSS runs Tailwind CSS and Autoprefixer during development and builds.

#### Backend dependencies

| Package | Version | Role |
|---|---:|---|
| FastAPI | 0.109 | REST API framework |
| Uvicorn | 0.27 | ASGI server used to run FastAPI |
| SQLAlchemy | 2.0.25 | ORM and database relationship management |
| Pydantic | 2.5.3 | Data validation and typed settings models |
| Pydantic Settings | 2.1 | Environment and `.env` configuration loading |
| Python Multipart | 0.0.6 | Multipart form and file-upload parsing |
| Aiofiles | 23.2 | Async-friendly file operations |
| HTTPX | 0.26 | HTTP client support and API testing utilities |

#### Data science and forensic processing

| Package | Version | Role |
|---|---:|---|
| Scikit-learn | 1.3.2 | Fragment classification and ML utilities |
| NumPy | 1.26.3 | Numeric arrays and statistical calculations |
| Pandas | 2.1.4 | Structured data manipulation and analysis support |
| SciPy | 1.11.4 | Scientific and similarity calculations |
| Joblib | 1.3.2 | Model and computed-data serialization support |
| Python Magic | 0.4.27 | File-type and MIME identification support |

#### Security, authentication, and testing dependencies

| Package | Version | Role |
|---|---:|---|
| Python-JOSE | 3.3.0 | JWT and signing utility support |
| Passlib | 1.7.4 | Password hashing utility support |
| Bcrypt | 4.1.2 | Password hashing algorithm support |
| Pytest | 7.4.4 | Backend test runner |
| Pytest-asyncio | 0.23.3 | Async test support |

#### Storage and serving infrastructure

| Technology | Role |
|---|---|
| SQLite | Default relational database for datasets, fragments, relationships, reconstructions, and audit logs |
| SQLAlchemy ORM | Database abstraction and model relationships |
| Local filesystem | Default storage for uploaded files under `backend/uploads/` |
| Vite proxy | Routes frontend `/api` calls to the local FastAPI server during development |
| FastAPI OpenAPI | Automatically generated interactive API documentation at `/docs` |

### Main routes

| Route | Purpose |
|---|---|
| `/` | Dashboard statistics, charts, recent datasets, and quick actions |
| `/dataset` | Resolves to the first available dataset for analysis |
| `/dataset/:id` | Dataset overview, fragment metrics, reconstruction metrics, and controls |
| `/fragments` | Resolves to the first available dataset's fragments |
| `/fragments/:id` | Fragment search, filtering, inspection, hashes, and suspicious flags |
| `/reconstructions` | Resolves to the first available dataset's reconstructions |
| `/reconstructions/:id` | Candidate reconstruction review and investigator decisions |
| `/graph` | Resolves to the first available dataset's relationship graph |
| `/graph/:id` | Interactive fragment relationship visualization |
| `/audit` | Resolves to the first available dataset's audit log |
| `/audit/:id` | Searchable and sortable chain-of-custody history |
| `/about` | Project overview, workflow, technology stack, and safety information |

The base feature routes resolve to the first dataset returned by the API. This keeps sidebar navigation useful even though the detailed pages are dataset-specific. If no dataset exists, the resolver displays a message directing the user back to the dashboard.

### Dashboard

The dashboard loads two API resources:

- `/api/datasets` for recent datasets.
- `/api/dashboard/stats` for aggregate counts and chart data.

It displays:

- Total fragments.
- Detected files.
- Reconstructions.
- Anomalies.
- Duplicate fragments.
- Confidence distribution.
- File type distribution.
- Integrity status distribution.
- Recent datasets.
- System status and quick actions.

The confidence and integrity pie charts intentionally keep labels out of the moving pie slices. Stable legends below each chart show category names, counts, and percentages so text remains readable while the chart resizes or animates.

## Backend

The backend is a FastAPI application launched from `backend/app/main.py`.

### Application setup

On startup, the backend creates database tables through `init_db()`. CORS is configured for the local Vite and common local frontend ports. The API is mounted under `/api`.

### API endpoints

#### Health and application status

- `GET /` returns application name, version, and status.
- `GET /health` returns a health status.

#### Datasets

- `GET /api/datasets` lists datasets.
- `GET /api/datasets/{dataset_id}` returns a dataset with fragments and reconstructions.
- `POST /api/datasets/demo` clears the current demo state and generates a synthetic dataset.
- `POST /api/datasets/upload` uploads a file and starts background processing.

#### Fragments

- `GET /api/datasets/{dataset_id}/fragments` lists fragments.
- `GET /api/datasets/{dataset_id}/fragments/{fragment_id}` returns one fragment.
- `POST /api/datasets/{dataset_id}/fragments/{fragment_id}/mark-suspicious` flags a fragment for investigation.

#### Reconstructions

- `GET /api/datasets/{dataset_id}/reconstructions` lists reconstruction candidates.
- `GET /api/datasets/{dataset_id}/reconstructions/{recon_id}` returns a candidate with fragment details and relationships.
- `POST /api/datasets/{dataset_id}/reconstructions/{recon_id}/accept` accepts a candidate.
- `POST /api/datasets/{dataset_id}/reconstructions/{recon_id}/reject` rejects a candidate.
- `POST /api/datasets/{dataset_id}/reconstructions/{recon_id}/override` applies an investigator-selected status.

#### Visualization and dashboard

- `GET /api/datasets/{dataset_id}/graph` returns graph nodes and edges.
- `GET /api/datasets/{dataset_id}/audit-log` returns timestamped audit records.
- `GET /api/dashboard/stats` returns aggregate dashboard metrics.

### APIs used by the project

#### Internal RecoverAI REST API

The frontend communicates with the FastAPI backend through the Axios client in `frontend/src/utils/api.js`. In development, Vite proxies `/api` requests to `http://localhost:8000`. The internal API is the primary integration used by the application.

| API area | Used by | Purpose |
|---|---|---|
| Dataset API | Dashboard, Dataset Analysis, Dataset Context | List, load, upload, and generate datasets |
| Dashboard Statistics API | Dashboard and Sidebar | Provide totals, anomaly counts, chart distributions, and quick statistics |
| Fragment API | Fragments page and Dataset Analysis | List, inspect, search, and flag fragments |
| Reconstruction API | Reconstructions page and Dataset Analysis | List candidates, inspect details, accept, reject, and override results |
| Evidence Graph API | Evidence Graph page | Provide relationship nodes, edges, scores, and graph metadata |
| Audit Log API | Audit Log page | Provide searchable chain-of-custody records |
| Health API | Operational checks | Confirm that the backend is running |

#### API request formats

- JSON is used for standard API request and response bodies.
- `multipart/form-data` is used for file uploads through the upload endpoint.
- Dataset and fragment identifiers are passed as URL path parameters.
- Reconstruction decisions use POST requests with investigator notes or override status values.
- API errors are normalized by the Axios response interceptor and surfaced to the relevant page.

#### Browser and platform APIs

RecoverAI does not call external cloud APIs or third-party SaaS APIs. It uses these browser/platform interfaces locally:

| API | Usage |
|---|---|
| Fetch API | Sidebar quick-stat request to `/api/dashboard/stats` |
| FormData API | Packages uploaded files and metadata for the upload request |
| Clipboard API | Copies fragment and reconstruction hashes for investigation notes |
| Browser History API through React Router | Client-side navigation between dashboard features |
| SVG and Canvas-backed chart rendering through Recharts | Renders dashboard charts and the evidence graph visualization |
| FastAPI OpenAPI | Generates interactive backend documentation at `/docs` |

The project is therefore self-contained for local development: the only network integration required is the local frontend-to-backend connection.

## Forensic Processing Workflow

1. **Dataset ingestion**
   - A user uploads a file or loads the synthetic demo dataset.
   - Uploaded files are stored under the backend upload directory.

2. **Fragment scanning**
   - Uploaded data is divided into chunks.
   - The analyzer extracts size, offsets, entropy, printable ratio, magic bytes, hashes, and other features.

3. **File classification**
   - Fragments are assigned likely types such as JPEG, PNG, PDF, DOCX, ZIP, TXT, HTML, encrypted data, or unknown.
   - Classification confidence and method are retained for explanation.

4. **Duplicate detection**
   - SHA-256 hashes are used to identify duplicate fragments.

5. **Suspicious-content detection**
   - The system records indicators such as high entropy, magic-byte mismatch, encrypted content, decoy signatures, and other anti-forensics signals.

6. **Relationship analysis**
   - Fragment pairs are compared using signature compatibility, structural similarity, metadata, content properties, and other relationship features.
   - Relationships above the configured threshold are stored and exposed through the graph endpoint.

7. **Candidate reconstruction**
   - Compatible fragment chains are assembled into reconstruction candidates.
   - Missing fragments, overlapping candidates, estimated size, and candidate status are recorded.

8. **Integrity verification**
   - Reconstructed candidates retain actual and expected hashes when available.
   - Integrity is categorized as verified, partial, failed, or unknown.

9. **Confidence scoring**
   - Confidence combines factors such as signature compatibility, relationship score, structural consistency, integrity verification, missing-fragment penalties, and contradiction penalties.
   - The frontend shows the score and its breakdown.

10. **Investigator review**
    - An investigator can accept, reject, override, or flag results.
    - Each action creates an audit entry.

## Implemented AI Pipeline

The production analysis path is implemented in `backend/app/services/ai_pipeline.py` and is used by both synthetic demo generation and uploaded-file processing.

```text
Disk/Image
   -> Fragment Extraction
   -> Feature Extraction
   -> Random Forest Classification
   -> Isolation Forest Anomaly Detection
   -> SHA-256 Hash and Similarity Analysis
   -> Relationship Correlation and Reconstruction
   -> Confidence and anomaly scores
   -> Investigator Dashboard
```

### Random Forest classification

`FragmentClassifier` in `fragment_analyzer.py` trains a scikit-learn `RandomForestClassifier` on a deterministic labelled corpus of file-signature and content-pattern examples. The feature vector includes fragment size, entropy, printable ratio, null/high-byte ratios, byte-frequency distribution, signature markers, document markers, and encryption hints. Each fragment receives a predicted file type, confidence score, class probabilities, and `classification_method: random_forest`.

### Isolation Forest anomaly detection

`FragmentAIPipeline` fits an `IsolationForest` over the complete fragment batch. It stores a normalized `anomaly_score`, an `anomaly_label`, and the model execution flag under `features.ai_analysis`. High-scoring fragments also receive an `isolation_forest_anomaly` suspicious indicator for investigator review. Anomaly flags are recommendations only; they do not change investigator decisions.

### Hash and similarity analysis

- SHA-256 is generated for every fragment.
- Exact duplicate groups are identified by matching hashes.
- Expected hashes, when supplied by a dataset, are compared and reported as verified, mismatch, or unverified.
- Existing relationship analysis compares signature compatibility, structural consistency, metadata, and byte-frequency cosine similarity.
- Dashboard statistics expose duplicate groups and strong content-similarity groups.
- Reconstruction overlap information is retained in `confidence_breakdown.overlaps_with` so conflicting candidates remain visible.

### Investigator separation

AI fields such as classification, confidence, anomaly scores, hash status, and relationship scores are recommendations and evidence metadata. Investigator actions such as accepting, rejecting, overriding, or flagging results continue to use the existing API endpoints and are recorded separately in `AuditLog`.

### Optional explanation layer

No external LLM service is enabled by default. This keeps the application local and prevents unsupported conclusions from being generated. The structured model probabilities, anomaly indicators, relationship details, hash status, and confidence breakdown provide grounded evidence for an eventual explanation layer without inventing findings.

## Data Model

### Dataset

Represents an uploaded or generated source dataset. It stores its name, description, source path, fragment count, processing status, and timestamps.

### Fragment

Represents a recovered chunk. It stores its dataset, offset, size, type, entropy, printable ratio, magic bytes, SHA-256 hash, duplicate status, classification information, extracted features, suspicious indicators, and current status.

### FragmentRelationship

Connects two fragments and stores the relationship type, compatibility score, supporting details, and creation time.

### Reconstruction

Represents a candidate recovered file. It stores file type, estimated and actual sizes, fragment counts, missing fragments, confidence score, confidence breakdown, integrity status, hashes, review status, and investigator notes.

### ReconstructionFragment

Associates fragments with a reconstruction in sequence order. It also supports missing-fragment placeholders and per-fragment confidence.

### AuditLog

Records dataset, reconstruction, or fragment actions with timestamps, previous and new statuses, user action text, additional details, and a hash value.

## Local Development

### Prerequisites

- Python 3.10 or newer.
- Node.js and npm.
- A terminal opened at the repository root.

### Install backend dependencies

```bash
cd backend
python3 -m pip install -r requirements.txt
```

### Install frontend dependencies

```bash
cd frontend
npm install
```

### Start the backend

From the repository root:

```bash
cd backend
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Backend URLs:

- Application: http://127.0.0.1:8000/
- Health check: http://127.0.0.1:8000/health
- OpenAPI documentation: http://127.0.0.1:8000/docs

### Start the frontend

In a second terminal:

```bash
cd frontend
npm run dev -- --host 127.0.0.1
```

Frontend URL:

- http://127.0.0.1:5173/

Vite proxies requests beginning with `/api` to `http://localhost:8000` during development.

### Build the frontend

```bash
cd frontend
npm run build
```

The production output is written to `frontend/dist/`.

### Test the AI pipeline

From the repository root, install backend dependencies and run the focused tests:

```bash
cd backend
python3 -m pytest tests/test_ai_pipeline.py -q
```

To exercise the real pipeline through the API and regenerate the synthetic dataset:

```bash
cd backend
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
curl -X POST http://127.0.0.1:8000/api/datasets/demo
curl http://127.0.0.1:8000/api/dashboard/stats
```

The dashboard response includes Random Forest method counts, Isolation Forest anomaly counts and average score, duplicate groups, similarity groups, and hash status counts.

## Typical Demo Walkthrough

1. Start the backend and frontend.
2. Open http://127.0.0.1:5173/.
3. Use **Load Demo Dataset** from the dashboard.
4. Open **Dataset Analysis** to inspect overall metrics.
5. Open **Fragments** to search and flag fragments.
6. Open **Reconstructions** to review candidate files.
7. Open **Evidence Graph** to inspect relationships.
8. Open **Audit Log** to verify recorded actions.
9. Open **About** for the product workflow and safety boundaries.

The demo generator is synthetic and intended to exercise the complete UI and analysis workflow without requiring a real forensic image.

## Configuration

Backend settings are defined in `backend/app/core/config.py` and can be overridden through environment variables or a backend `.env` file.

Important settings include:

- `APP_NAME`
- `APP_VERSION`
- `DEBUG`
- `DATABASE_URL`
- `UPLOAD_DIR`
- `MAX_UPLOAD_SIZE`
- `CORS_ORIGINS`

The default database is SQLite at `./recoverai.db` relative to the backend process directory. Uploaded files default to `./uploads`.

## Safety and Intended Use

RecoverAI is an analysis and review tool. It is intended for authorized investigations, controlled demonstrations, and synthetic or lawfully acquired data.

The system:

- Flags encrypted or high-entropy content rather than attempting to decrypt it.
- Uses hashes for integrity and duplicate checks.
- Keeps investigator decisions in an audit trail.
- Does not provide credential recovery, password cracking, unauthorized acquisition, or live-system intrusion capabilities.

Results are candidate findings and should be independently verified by a qualified investigator before being treated as evidence.

## Known Development Notes

- The frontend bundle currently produces a Vite warning about a large JavaScript chunk. This is a performance warning, not a build failure.
- The application uses React Router v6 and may display future-version migration warnings in the browser console.
- The prototype currently uses SQLite and local filesystem storage; production deployments would need stronger configuration, access control, storage management, and operational logging.
