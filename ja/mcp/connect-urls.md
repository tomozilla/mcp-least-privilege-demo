# MCP接続URLの読み方

ダッシュボードの **Connect → MCP** タブで、スイッチを切り替えると、AIツールに追加するコマンドが変わります。
私が画面で見た内容を、そのまま書き写したものです（`<PROJECT_REF>` は、あなたのプロジェクトの識別子に置き換えてください）。

## 初期状態（プロジェクトの画面から開いた場合）

```bash
claude mcp add --scope project --transport http supabase \
  "https://mcp.supabase.com/mcp?project_ref=<PROJECT_REF>&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching"
```

## 読み取り専用 + 道具を3グループに絞った場合

```bash
claude mcp add --scope project --transport http supabase \
  "https://mcp.supabase.com/mcp?project_ref=<PROJECT_REF>&read_only=true&features=docs%2Cdatabase%2Cdebugging"
```

## URLの部分と、意味

| URLの部分 | 意味 |
|---|---|
| `project_ref=<PROJECT_REF>` | **範囲**: このプロジェクトだけに限定 |
| `read_only=true` | **書き込み禁止**: 読み取り専用のPostgresユーザーとしてクエリを実行（ドキュメントの説明） |
| `features=docs,database,debugging` | **道具**: 渡す機能のグループ |

## 確かめたこと / 確かめていないこと

- ✅ ダッシュボードで、スイッチを入れるとURLがこう変わること
- ✅ `supabase_read_only_user` というロールがDBの中にあること（`sql/00_inspect_read_only_role.sql`）
- ⚠️ 本物のロールには切り替えられなかったので、似た権限のロール `demo_reader` で動きを確認（`sql/01〜04`）
- ❌ **実際のAIエージェントを接続しての動作確認は、していません**
