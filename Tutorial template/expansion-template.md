# NextBit Tutorial Authoring & Expansion Guide

This guide explains how to construct new tutorials, expand existing ones, insert interactive terminal code blocks, format callout notes/warnings, and maintain design system consistency.

---

## 🎨 1. Palette & Design Specs

| Element | Background / Color | Text Color | Notes |
| :--- | :--- | :--- | :--- |
| **Page Body** | `#F9FAFA` | `#1F2937` | Light gray background |
| **Terminal Box** | `#0D1117` | `#E6EDF3` | Dark VS Code/GitHub dark shell |
| **Terminal Prompt (`$`)**| N/A | `#5FDDAC` | Mint green prompt indicator |
| **Note Callout** | `#ECFDF5` | `#065F46` | Left border `#10B981` |
| **Warning Callout**| `#FEF2F2` | `#991B1B` | Left border `#EF4444` |
| **Recommendation Card**| `#14231E` | `#FFFFFF` | Dark mint green container |
| **Card Category Pill** | `#5FDDAC` | `#042F2E` | **Dark Green Text** on Mint Pill |

---

## ➕ 2. How to Add a New Step

To append a step, insert this block inside `<div class="tutorial-body">`:

```html
<section class="tutorial-step">
    <h2 class="step-title">Step X: Step Title Here</h2>

    <div class="tutorial-media-box step-image-box">
        <img src="../../Image/your-step-image.avif" alt="Description of action" class="tutorial-img">
    </div>

    <p class="content-text">
        Provide detailed explanation of the steps here. Use <code>inline code</code> for quick commands, directory paths, or parameters.
    </p>
</section>