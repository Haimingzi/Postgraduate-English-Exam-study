# 考研完形填空生成器 (Postgraduate English Cloze Test Generator)

一个基于 AI 的考研英语完形填空练习生成工具，支持自定义单词列表，自动生成符合考研难度的文章和选项。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Haimingzi/Postgraduate-English-Exam-study)

## ✨ 功能特点

- 🎯 **智能生成**：基于 DeepSeek AI，生成符合考研难度的完形填空文章
- 📝 **自定义单词**：输入目标单词，自动融入文章中
- 🔤 **词汇控制**：严格使用考研大纲词汇（约 5,500 词），避免超纲词汇
- 📖 **单词详解**：点击任意单词查看音标、词性、中文释义
- 💾 **云端同步**：登录后历史记录和单词缓存自动同步到云端
- 📱 **多设备支持**：在手机、平板、电脑间无缝切换
- 🎨 **精美界面**：现代化 UI 设计，流畅的用户体验
- ⚡ **本地缓存**：查过的单词自动缓存，减少 API 调用

## 🚀 快速开始

### 在线使用

访问 [在线演示](https://your-app.vercel.app)（替换为你的 Vercel 部署地址）

### 本地开发

1. **克隆项目**

```bash
git clone https://github.com/Haimingzi/Postgraduate-English-Exam-study.git
cd Postgraduate-English-Exam-study
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

创建 `.env.local` 文件：

```env
# DeepSeek API（必需）
DEEPSEEK_API_KEY=your_deepseek_api_key

# Supabase（可选，用于云端同步）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **启动开发服务器**

```bash
npm run dev
```

访问 http://localhost:3000

## 🔑 获取 API 密钥

### DeepSeek API（必需）

1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/)
2. 注册并登录
3. 在 API Keys 页面创建新密钥
4. 复制密钥到 `.env.local` 文件

### Supabase（可选，用于云端同步）

如果需要用户登录和数据同步功能：

1. 访问 [Supabase](https://supabase.com/)
2. 创建新项目
3. 在 Settings → API 获取 Project URL 和 anon key
4. 在 SQL Editor 执行 `SUPABASE_SETUP.md` 中的 SQL 代码
5. 配置环境变量

详细步骤请参考 [USER_GUIDE.md](./USER_GUIDE.md)

## 📦 部署到 Vercel

1. **Fork 本项目**

2. **导入到 Vercel**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "New Project"
   - 导入你 Fork 的仓库

3. **配置环境变量**
   - 在 Vercel 项目设置中添加环境变量
   - 至少需要配置 `DEEPSEEK_API_KEY`

4. **部署**
   - Vercel 会自动构建和部署
   - 每次 push 到 main 分支都会自动重新部署

## 📖 使用说明

### 基本使用

1. **输入单词**：在文本框中输入要练习的单词（每行一个或逗号分隔）
2. **生成文章**：点击"生成"按钮，AI 会创建包含这些单词的完形填空
3. **答题练习**：点击空白处选择答案
4. **查看详解**：选择答案后自动显示解析
5. **单词查询**：点击文章中的任意单词查看详细信息

### 高级功能

- **历史记录**：点击右上角时钟图标查看历史记录
- **用户登录**：登录后数据自动同步到云端
- **多设备同步**：在不同设备登录同一账号，数据自动同步

## 🛠️ 技术栈

- **框架**：Next.js 14 (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **AI**：DeepSeek API
- **数据库**：Supabase (PostgreSQL)
- **认证**：Supabase Auth
- **部署**：Vercel

## 📁 项目结构

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   └── actions/           # Server Actions
│   ├── components/            # React 组件
│   │   ├── auth/             # 认证相关
│   │   ├── history/          # 历史记录
│   │   ├── home/             # 主页面
│   │   └── reading/          # 阅读区组件
│   ├── lib/                   # 工具库
│   │   ├── supabase.ts       # Supabase 客户端
│   │   └── wordCache.ts      # 单词缓存
│   └── types/                 # TypeScript 类型定义
├── SUPABASE_SETUP.md         # Supabase 配置指南
├── USER_GUIDE.md             # 用户使用指南
└── README.md                 # 本文件
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 开发计划

- [ ] 添加更多题型（阅读理解、翻译等）
- [ ] 支持自定义难度级别
- [ ] 添加错题本功能
- [ ] 支持导出 PDF
- [ ] 添加学习统计和进度追踪
- [ ] 支持更多语言模型

## ⚠️ 注意事项

1. **API 费用**：DeepSeek API 按使用量计费，请注意控制成本
2. **词汇准确性**：AI 生成的内容可能不是 100% 符合考研大纲，建议结合实际教材使用
3. **数据隐私**：用户数据通过 Supabase 行级安全策略保护，仅用户本人可访问

## 📄 许可证

[MIT License](LICENSE)

## 🙏 致谢

- [DeepSeek](https://www.deepseek.com/) - 提供强大的 AI 能力
- [Supabase](https://supabase.com/) - 提供数据库和认证服务
- [Vercel](https://vercel.com/) - 提供部署平台
- [Next.js](https://nextjs.org/) - 优秀的 React 框架

## 📧 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 [Issue](https://github.com/Haimingzi/Postgraduate-English-Exam-study/issues)
- 发送邮件至：[your-email@example.com]

---

⭐ 如果这个项目对你有帮助，请给个 Star！

