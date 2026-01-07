# Beads Inventory (Web + Vision) — TS + Python

一个给自己用的拼豆（Perler beads）库存管理小系统（双栈）：
- Web：管理库存 / 阈值预警 / 消耗记录（历史）
- Vision（Python）：解析图纸“汇总文字”（MVP 已跑通），后续可扩展 OCR/大模型识别

> ✅ 当前进度：  
> 1) Web 能 CRUD beads（库存）  
> 2) Alerts（低库存阈值预警）  
> 3) History（StockChange 变更记录）  
> 4) Scan：粘贴图纸汇总文字 → 解析扣减清单 → 一键扣库存（并写入 StockChange）  
> 5) Scan 支持 “Missing 自动创建 + 不足库存一键补货” 流程（如果你已加）

---

## 1. Tech Stack

### Web
- Next.js (App Router) + TypeScript
- Prisma + SQLite

### Vision
- FastAPI + Uvicorn
- （当前）纯文本解析：把图纸底部汇总文本解析成 `{colorCode, count}` 列表  
- （后续可选）OCR: Tesseract / 或 OpenAI Vision

---

## 2. Repo Structure

beads-inventory/
apps/
web/ # Next.js + Prisma (SQLite)
prisma/
src/
vision/ # FastAPI service
main.py
requirements.txt
.venv/ # 本地虚拟环境（不要提交）


---

## 3. Features

### Inventory（库存）
- 保存：`colorCode`, `name`, `quantity`, `threshold`
- 支持增减库存（写入 StockChange）

### Alerts（阈值预警）
- `quantity < threshold` 自动显示低库存列表
- 一键补货（+200 / +500 等）

### History（消耗记录）
- 所有变更都会写入 StockChange（delta 正负都可）
- 用于审计追溯

### Scan（导入图纸 / 扣减）
- 粘贴图纸底部汇总行/汇总表文字（例如 `P01 120`, `P02:300`, `P10x50`）
- 解析为扣减清单
- 一键 Apply：批量扣库存 + 写 StockChange
- 若解析出缺失色号：提示 Missing → 一键创建（qty=0）
- 若库存不足：提示 Insufficient → 一键补货 → 再 Apply

---

## 4. Prerequisites（建议版本）

- Windows 10/11 + PowerShell
- Node.js（推荐 20 LTS；你目前 Node 24 也能跑）
- Python 3.10+（推荐 3.11）
- Git

---

## 5. 环境变量（Web）

### apps/web/.env.example
```env
DATABASE_URL="file:./dev.db"
# 可选：如果你把 /api/scan 做成读取环境变量（推荐）
VISION_URL="http://127.0.0.1:8000"




6. 从零到当前版本（一步一步复现）
Step A — 创建项目结构
mkdir beads-inventory
cd beads-inventory
mkdir apps

Step B — 创建 Web（Next.js）
cd apps
npx create-next-app@latest web --ts --eslint


启动 Web：

cd web
npm run dev
# http://localhost:3000

Step C — 创建 Vision（FastAPI）
cd ..\  # 回到 apps
mkdir vision
cd vision

python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1

pip install fastapi uvicorn python-multipart


创建 apps/vision/main.py（至少包含 health）：

from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    return {"ok": True}


启动 Vision：

uvicorn main:app --reload --port 8000
# http://127.0.0.1:8000/health

Step D — Web 调用 Vision（确认双栈联通）

在 web 里做一个 API 转发（避免 CORS），例如：
apps/web/src/app/api/vision-health/route.ts

export const runtime = "nodejs";

export async function GET() {
  const res = await fetch("http://127.0.0.1:8000/health");
  const text = await res.text();
  return new Response(text, { status: res.status, headers: { "Content-Type": "application/json" }});
}

7. Prisma + SQLite（库存表 / 阈值 / 消耗记录）
Step A — 安装 Prisma
cd apps\web
npm i prisma @prisma/client
npx prisma init --datasource-provider sqlite


apps/web/prisma/schema.prisma（示例）

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Bead {
  id        Int      @id @default(autoincrement())
  colorCode String   @unique
  name      String?
  quantity  Int
  threshold Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  changes   StockChange[]
}

model StockChange {
  id        Int      @id @default(autoincrement())
  beadId    Int
  delta     Int
  note      String?
  createdAt DateTime @default(now())

  bead      Bead @relation(fields: [beadId], references: [id])
}


迁移：

npx prisma migrate dev --name init


⚠️ 你之前遇到过 Prisma 7 的 P1012（schema datasource url 不支持）
✅ 解决方式：使用 Prisma 6.x（你现在就是 6.19.1） 或按 Prisma 7 新配置方式。
推荐先锁在 Prisma 6，保证不折腾。

8. API Endpoints（Web）

（你当前项目大概包含这些）

Inventory

GET /api/beads：列表

POST /api/beads：创建/更新（推荐 upsert）

POST /api/beads/:id/change：库存增减 + 写 StockChange
body: { "delta": 200, "note": "restock..." }

Alerts

GET /api/alerts：低库存列表（quantity < threshold）

History

GET /api/changes：StockChange 列表（最新优先）

Scan / Apply

POST /api/scan：把表单转发给 vision /parse，返回 items

POST /api/apply：批量扣库存 + 写 StockChange
body: { note: "scan apply", items: [{colorCode:"P01", count:120}...] }

9. Vision Service（当前：纯文本解析）

Vision 提供：

GET /health

POST /parse

summary_text（Form）存在 → 解析汇总文字

image（后续 OCR 扩展）

汇总文字示例输入：

P01 120
P02:300
P10x50


输出示例：

{
  "mode": "summary_text",
  "items": [
    {"colorCode":"P01","count":120},
    {"colorCode":"P02","count":300},
    {"colorCode":"P10","count":50}
  ]
}

10. Running Locally（本地启动）

开两个终端：

Terminal A（vision）
cd apps\vision
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000

Terminal B（web）
cd apps\web
npm run dev


访问：

Web: http://localhost:3000

Vision: http://127.0.0.1:8000/health

页面：

/ Inventory

/alerts

/history

/scan

11. PowerShell 调试/踩坑总结（你之前遇到的）
11.1 npx 无法识别

原因：Node 环境没生效 / PATH 问题。
检查：

node -v
npm -v
npx -v


✅ 你后来已经 OK（能跑 create-next-app）。

11.2 Next 报错：Conflicting route and page at /scan

原因：你同时创建了：

src/app/scan/page.tsx（页面）

src/app/scan/route.ts（route handler）
同一路径不能既是 page 又是 route。

✅ 修复：删掉 src/app/scan/route.ts
API 必须放到：src/app/api/scan/route.ts

11.3 Next 报错：params is a Promise

报错类似：
Route "/api/beads/[id]/change" used params.id. params is a Promise ...

✅ 修复方式（Route Handler）：

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const beadId = Number(id);
  ...
}


（或根据你 Next 版本改成非 Promise 结构，但你遇到的是 Promise 版本）

11.4 PowerShell curl -H 报错（Headers 不是 IDictionary）

在 PowerShell 里 curl 默认是 Invoke-WebRequest 的别名，不是 curl.exe。

✅ 两种写法：

A) 用 curl.exe（推荐）

curl.exe -X POST http://localhost:3000/api/beads ^
  -H "Content-Type: application/json" ^
  -d "{\"colorCode\":\"P01\",\"name\":\"White\",\"quantity\":1000,\"threshold\":200}"


B) 用 Invoke-RestMethod

Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3000/api/beads" `
  -ContentType "application/json" `
  -Body '{"colorCode":"P01","name":"White","quantity":1000,"threshold":200}'

11.5 Conda 环境混乱（python 指向 Anaconda）

你看到 python -c "import sys; print(sys.executable)" 还是 D:\ANACONDA\python.exe 是正常的（conda base）。

✅ 推荐：Vision 统一用 apps/vision/.venv，不要混用 conda。

cd apps\vision
.\.venv\Scripts\Activate.ps1
python -c "import sys; print(sys.executable)"
# 应该指向 ...\apps\vision\.venv\Scripts\python.exe