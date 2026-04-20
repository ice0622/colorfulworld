---
number: 1
slug: "hello-new-cms"
tags:
  - test
  - travel
date: "2026-03-19T12:00:00.000Z"
updated: "2026-03-19T12:00:00.000Z"
location: "Tokyo, Japan"
title: "新CMSへの移行テスト"
description: "Wisp CMSから独自CMSへの移行テスト記事です。Markdownで書かれたコンテンツが正しく表示されることを確認します。"
metaTags:
  - cms
  - markdown
coverImage: "/images/placeholder.webp"
featured: false
draft: false
---

## はじめに

このブログは **Wisp CMS** から独自の Markdown ベース CMS へ移行しました。

`content/posts/` 以下に `.md` ファイルを置くだけで記事として公開されます。

---

## frontmatter の仕様

記事の先頭に以下のメタデータを記述します。

| フィールド | 説明 |
|-----------|------|
| `number` | 記事の連番 |
| `slug` | URLに使われる識別子 |
| `tags` | タグ（複数可） |
| `date` | 公開日時 |
| `location` | 撮影・執筆場所 |
| `title` | 記事タイトル |
| `description` | 概要（OGP・カード表示用） |

---

## Markdown の書き方

### 見出し

`##` で見出しを作れます。

### リスト

- 東京
- パリ
- マンチェスター

### コードブロック

```javascript
const hello = "world";
console.log(hello);
```

### 画像

画像は CDN URL または `/images/` 以下のパスで指定します。

![プレースホルダー画像](/images/placeholder.webp)

---

## リンク

[GitHub](https://github.com) へのリンクも普通に書けます。

---

テスト完了 🎉
