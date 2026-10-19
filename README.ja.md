# mcp-least-privilege-demo

[English](README.md) | 日本語

> コードのコメントを日本語にしたもの（画面も日本語）は [`ja/`](ja/) にあります。本体（`sql/` `supabase/` `app/` `mcp/` など）は英語です。ファイルのパスは英語版のものを指しています。

AIエージェント（MCP）にデータベースを触らせる前に、「渡す鍵の範囲」を絞る設定と、「読み取り専用」がDBの中では何なのかを確かめる、小さな学習用デモです。

> **個人の学習記録として作ったサンプルです。** 特定の会社の公式サンプルではなく、セキュリティ対策の十分な見本でもありません。
> English summary: notes on the Supabase MCP connection URL parameters (`project_ref`, `read_only`, `features`) and SQL that shows what a read-only role can and cannot do (a look-alike role, because the real managed role can't be assumed from the SQL Editor). **I did not connect a real AI agent.**

この記事のコードです:
- 手順編: Qiita「AIエージェントにDBを触らせる前に：Supabase MCPの読み取り専用モードとプロジェクト限定設定」
- アプリ編: Qiita「AIに渡す前の「データ棚卸し」Webアプリをつくってみた：MCPの接続URLづくりと、AIから見えるテーブルの一覧」（`app/` と `supabase/functions/exposure-report/`）

## 中身

| ファイル | 役割 |
|---|---|
| `mcp/connect-urls.md` | 接続URLの読み方（範囲・書き込み禁止・道具） |
| `mcp/checklist.md` | AIに触らせる前のチェックリスト |
| `sql/00_inspect_read_only_role.sql` | 読み取り専用ロールの属性（`rolbypassrls`）を見る |
| `sql/01_create_demo_reader.sql` | 似た権限のロール `demo_reader` を作る |
| `sql/02_check_read.sql` | 読める（**RLSをすり抜けるので、全社分が見える**） |
| `sql/03_check_write_denied.sql` | 書けない（`42501`） |
| `sql/04_check_drop_denied.sql` | 消せない（`42501`） |
| `sql/99_cleanup.sql` | デモ用ロールを消す |

## データ棚卸しの画面（`app/`）

「テーブルごとに、ブラウザ・ログインしたユーザー・AI（読み取り専用の接続）から、どう見えるか」を一覧にして、「AIに見せたくない」と決めたテーブルが読めるときに警告する画面と、MCPの接続URLをチェックでつくる画面です（HTML 1枚、ビルド不要）。

```bash
# supabase/functions/exposure-report/index.ts を、exposure-report という名前でデプロイ（Verify JWT はオフ。キーの確認は関数の中）
cd app
cp config.example.js config.js     # URL と publishable キーを入れる（config.js は .gitignore 済み）
python3 -m http.server 8765 --bind 127.0.0.1   # → http://127.0.0.1:8765/index.html
```

- 関数が返すのは、テーブル名・列名・行数・権限・ポリシーの数だけです（行の中身は返しません）。それでも社外に見せてはいけない情報です。公開するページには、本物のログインを付けてください。
- 「見え方」は目安です。ポリシーの条件（`using`）は読んでいません。判定は、実際にログインなしでAPIから読んだ行数（`posts` だけ読めた）と突き合わせて直しました（2026年10月）。
- 費用: 画面を開くと関数が1回呼ばれるだけです（Freeの月50万回に対してほぼ無視できます）。
- 注意: 実際のAIエージェントとは接続していません。読み取り専用ロールで実際にSQLを実行したこともありません（権限の設定から出した判定です）。接続URLの各グループの説明は、ツール名から読み取ったもので、一部はドキュメントの説明を確かめていません。

## 必要なもの

- Supabaseのプロジェクト（Freeプランのデモで確認しました）
- 前の記事のテーブル（`tenants` / `invoices`）。`rls-multitenancy-demo` の `sql/01〜05` を先に実行してください
- MCPの接続自体は、お使いのAIツール側の設定です。このリポジトリには、接続するコードはありません

## 使い方

1. `mcp/connect-urls.md` を読んで、ダッシュボードの **Connect → MCP** で、スイッチを入れたときにURLがどう変わるか見てみます。
2. SQL Editorで、`sql/00` を実行します（読み取り専用ロールがあることの確認）。
3. `sql/01` で似たロールを作り、`02` → `03` → `04` を順に実行します。`02`〜`04` は `begin;` から始まるので、実行後に `rollback;` を実行してください。`04` は「破壊的な操作」の確認が出ますが、ロールの権限で実行するので、エラーで止まります（デモ用プロジェクトでだけ実行してください）。

期待される結果:

- `02`: 2社・4件ぜんぶ見える
- `03`: `ERROR: 42501: permission denied for table invoices`
- `04`: `ERROR: 42501: must be owner of table invoices`

私は、この順で実行して上のとおりの結果になることを確認しました（2026年10月）。

## 費用

- このリポジトリのSQLと設定は、Freeプランの範囲で動きました。追加の料金はかかっていません。
- AIツール側の利用料（お使いのAIサービスの料金）は、このリポジトリの範囲外で、私は測っていません。

## 確かめられていないこと（正直ベース）

- **実際のAIエージェントを接続して、権限どおりに動くか**（認証が必要で、見送りました）
- 「データの中の命令にAIが従ってしまう」問題が、実際のAIでどのくらい起きるか
- `demo_reader` は**似た権限のロール**で、Supabaseの本物のロールそのものではありません

## 注意

- 「読み取り専用」は「何も漏れない」ではありません。**RLSをすり抜けるロールは、見える範囲のデータを全部読めます。** 範囲の限定（`project_ref`）や、人による承認と組み合わせてください。
- 本物のお客さまのデータがあるプロジェクトには、つながないでください。

## ライセンス

MIT（`LICENSE` を参照）
