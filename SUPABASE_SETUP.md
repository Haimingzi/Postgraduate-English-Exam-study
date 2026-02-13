# Supabase 配置说明

## 环境变量设置

在 `.env.local` 文件中添加以下环境变量：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 获取 Supabase 凭证

1. 访问 https://supabase.com/
2. 注册/登录账号
3. 创建新项目
4. 在项目设置中找到 API 设置
5. 复制 Project URL 和 anon public key

## 数据库表结构

执行以下 SQL 创建所需的表：

```sql
-- 创建历史记录表
CREATE TABLE history_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word_list TEXT NOT NULL,
  article TEXT NOT NULL,
  options JSONB NOT NULL,
  options_detail JSONB,
  annotations JSONB,
  answers JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建单词缓存表
CREATE TABLE word_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  phonetic TEXT NOT NULL,
  part_of_speech TEXT NOT NULL,
  meaning TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, word)
);

-- 创建索引
CREATE INDEX idx_history_records_user_id ON history_records(user_id);
CREATE INDEX idx_history_records_created_at ON history_records(created_at DESC);
CREATE INDEX idx_word_cache_user_id ON word_cache(user_id);
CREATE INDEX idx_word_cache_word ON word_cache(word);

-- 启用行级安全策略 (RLS)
ALTER TABLE history_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_cache ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户只能访问自己的数据
CREATE POLICY "Users can view their own history records"
  ON history_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history records"
  ON history_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own history records"
  ON history_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history records"
  ON history_records FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own word cache"
  ON word_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own word cache"
  ON word_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own word cache"
  ON word_cache FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own word cache"
  ON word_cache FOR DELETE
  USING (auth.uid() = user_id);
```

