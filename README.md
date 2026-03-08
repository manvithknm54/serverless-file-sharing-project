# DropIt — Serverless File Sharing System

> Upload any file. Get a permanent shareable link. Instantly.

DropIt is a cloud-native, serverless file sharing platform built on AWS. Upload single files or bundle multiple files together — each gets a unique shareable link with a live preview page. No login required. No expiry.

---

## Live Demo

> 🌐 **[Coming Soon — Deployment in Progress]**

---

## Features

- **Single File Upload** — Upload any file type (images, PDFs, docs, videos, zip, etc.) up to 10MB and get an instant shareable link
- **Bundle Upload** — Upload multiple files together and get one master bundle link that shows all files
- **Live Preview Page** — Anyone opening a shared link sees a clean preview page with download button
- **Copy Link** — One-click copy of any file or bundle link
- **Download All** — Download every file in a bundle with one click
- **No Login Required** — Pure upload and share, zero friction
- **Permanent Storage** — Files stay forever until manually deleted
- **All File Types Supported** — JPG, PNG, PDF, DOCX, PPTX, CSV, MP4, ZIP and more

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript, Tailwind CSS |
| Backend | AWS Lambda (Python 3.12) |
| Storage | AWS S3 |
| API | Amazon API Gateway (REST) |
| Permissions | AWS IAM |
| Monitoring | AWS CloudWatch |
| Version Control | Git + GitHub |
| Hosting | AWS S3 Static Website Hosting |

---

## System Architecture

```
User (Browser)
      │
      ▼
Frontend (S3 Static Hosting)
      │
      ▼
Amazon API Gateway
  POST   /upload  → Upload file
  DELETE /upload  → Delete file
  GET    /upload  → List bundle files
      │
      ▼
AWS Lambda (uploadFileFunction)
  - Decodes base64 file content
  - Validates file size (max 10MB)
  - Generates unique file path
  - Uploads to S3
  - Returns download URL + bundle URL
      │
      ▼
AWS S3 Bucket (bucket-serverless-file-sharing)
  single-files/  → Individual uploads
  bundles/       → Multi-file bundles
      │
      ▼
Shareable Download Link returned to user
```

---

## Project Structure

```
serverless-file-sharing-project/
│
├── frontend/
│   ├── index.html          # Main upload page
│   ├── preview.html        # File/bundle preview page
│   ├── style.css           # Global styles
│   └── script.js           # Upload logic, API calls, bundle handling
│
├── backend/
│   ├── lambda_function.py  # AWS Lambda handler (upload, delete, list)
│   └── iam_policy.json     # IAM role policy reference
│
├── architecture.png        # System architecture diagram
└── README.md
```

---

## API Reference

**Base URL:**
```
https://svzju8smoa.execute-api.ap-south-1.amazonaws.com/prod
```

### POST /upload — Upload a File

**Request:**
```json
{
  "file_name": "photo.jpg",
  "file_type": "image/jpeg",
  "file_content": "<base64 encoded string>",
  "bundle_id": "bundle_1234567890"
}
```

**Response:**
```json
{
  "message": "File uploaded successfully!",
  "download_url": "https://bucket-serverless-file-sharing.s3.ap-south-1.amazonaws.com/single-files/abc123_photo.jpg",
  "file_name": "photo.jpg",
  "s3_key": "single-files/abc123_photo.jpg",
  "bundle_id": null,
  "bundle_url": null
}
```

---

### DELETE /upload — Delete a File

**Request:**
```json
{
  "s3_key": "single-files/abc123_photo.jpg"
}
```

**Response:**
```json
{
  "message": "File deleted successfully!"
}
```

---

### GET /upload — List Bundle Files

**Request:**
```
GET /upload?bundle_id=bundle_1234567890
```

**Response:**
```json
{
  "bundle_id": "bundle_1234567890",
  "total_files": 3,
  "files": [
    {
      "file_name": "photo.jpg",
      "file_size": 102400,
      "download_url": "https://bucket...s3.../bundles/bundle_123/photo.jpg",
      "s3_key": "bundles/bundle_123/photo.jpg"
    }
  ]
}
```

---

## Setup & Deployment Guide

### Prerequisites
- AWS Account (Free Tier works)
- Git installed
- Basic understanding of AWS Console

### Step 1 — Clone the Repository
```bash
git clone https://github.com/manvithknm54/serverless-file-sharing-project.git
cd serverless-file-sharing-project
```

### Step 2 — AWS S3 Bucket Setup
1. Go to AWS Console → S3 → Create bucket
2. Bucket name: `bucket-serverless-file-sharing`
3. Region: `ap-south-1` (Mumbai)
4. Disable "Block all public access"
5. Add CORS policy:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```
6. Add Bucket Policy for public read access

### Step 3 — IAM Role Setup
1. Go to IAM → Roles → Create role
2. Trusted entity: AWS Lambda
3. Attach policies: `AmazonS3FullAccess`, `CloudWatchLogsFullAccess`
4. Role name: `lambda-s3-access-role`

### Step 4 — Lambda Function Setup
1. Go to Lambda → Create function
2. Name: `uploadFileFunction`
3. Runtime: Python 3.12
4. Attach role: `lambda-s3-access-role`
5. Paste code from `backend/lambda_function.py`
6. Deploy

### Step 5 — API Gateway Setup
1. Create REST API → `file-sharing-api`
2. Create resource: `/upload`
3. Add methods: POST, DELETE, GET (all connected to Lambda)
4. Enable CORS
5. Deploy to stage: `prod`

### Step 6 — Deploy Frontend
1. Enable S3 Static Website Hosting on your bucket
2. Upload all files from `frontend/` folder
3. Set `index.html` as root document
4. Access via the S3 website URL

---

## Team

| Role | Person | Responsibilities |
|------|--------|-----------------|
| Cloud / Backend Engineer | Ankush N R | S3, Lambda, API Gateway, IAM, CloudWatch |
| Frontend / Deployment Engineer | Manvith K N M | UI, JavaScript, Preview pages, Hosting |

---

## What We Learned

- Serverless architecture using AWS Lambda and API Gateway
- Cloud storage management with AWS S3 (bucket policies, CORS, folder structure)
- IAM roles and least-privilege access control
- REST API design with multiple HTTP methods (POST, GET, DELETE)
- Base64 file encoding and decoding for API transmission
- Git-based team collaboration with feature branches and pull requests
- Frontend-backend integration with fetch API
- CloudWatch monitoring and logging

---

## Resume Points

```
DropIt — Serverless File Sharing System | AWS

- Architected a serverless file sharing platform using AWS Lambda, API Gateway,
  and S3 supporting single and multi-file bundle uploads with permanent storage

- Implemented REST API with POST, GET, DELETE endpoints handling file upload,
  bundle listing, and deletion with proper CORS and IAM security configuration

- Built responsive frontend with live file preview, drag-and-drop upload,
  bundle sharing, and one-click download using HTML, Tailwind CSS and JavaScript

- Collaborated using Git branching strategy with feature branches,
  pull requests and versioned releases in a 2-member team workflow
```

---

## License

This project is built for educational purposes as a college mini project.
