---
number: 6
slug: "openapi"
tags:
  - "TECH"
date: "2025-10-09"
updated: "2026-04-23"
location: ""
title: "２万行にもなるOpenAPIをどう管理していくか"
description: "肥大化していて便利なのか不便なのかよくわからない"
metaTags:
  - ""
coverImage: "/images/posts/TECH/openapi.png"
featured: false
draft: false
---

あるプロジェクトに参加したのですが、APIの仕様書をOpenAPIで管理することになりました

最初のころは数千行でおさまり、フロントエンドの人たちはOpenAPIでAPIクライアントを自動生成できるらしく、みんなニコニコで作業を進めていました

案件が終わり、書いたコードの整理に入る段階でOpenAPIを見てみたらなんということでしょう。数千行だったはずが、２万行にも上る巨大ファイルになっていました

案件の終わり際、やたら仕様書書くの手間だな、、って思ってたらこんなことになっているとは思ってもいませんでした。

自分への戒めと誰かの助けになればとおもって、整理方法や運用方法を考えてみます

以下の記事を参考にしました
[肥大化したOpenAPI YAMLファイルの分割と運用方法](https://zenn.dev/collabostyle/articles/e7e3faddc27aff)

## 1. 仕様書が肥大化するメカニズム

なぜ、そもそも一つの巨大なOpenAPIファイルが生まれてしまうのか、その原因から始めます。

- 同じような処理のAPIを使いまわし
フロントエンドとの都合上、エンドポイントをわける必要があってその仕様にならざるを得なかった

- 共通部品を使えている箇所とあまり使えていない箇所が散乱している
最初の段階では共通箇所が理解しきれていなかった。これは仕様の把握が甘かったからのもありますかね

- 多くの人が編集することになり、API仕様書の共通ルールみたいなものを決めていなかったので、似たようなコンポーネントが散乱することになってます...また仕様書がきっちり決まっていないのもあって、APIのレスポンスもこれといった決まった形になっていないことがあった

- モノリシックな仕様の弊害：開発初期は便利だった単一ファイルが、プロジェクトの成長と人員増加により、マージコンフリクトやレビューの困難さを引き起こすか。

- 認知不可の増大：仕様書が長大になることで、特定のAPIの場所を探すのが難しくなり、開発者や利用者の認知負荷が高まる問題。

## 2. 「分割統治」とマイクロサービスアーキテクチャ

ファイル分割の技術を、ソフトウェア開発のより大きな概念と結びつけます。

- 分割統治の原則：複雑な問題を小さな独立した問題に分けて解決する基本的な設計思想

- マイクロサービスとの関係：APIをマイクロサービス（小さな独立したサービス）として設計する場合、そのサービスに特化した/仕様書を持つことが自然。

以下はOpenAPI分割のメリットとデメリットです。

- 開発効率

  >メリット：複数の開発者間でのマージコンフリクトが減少する。
  >
  >デメリット：運用が複雑化し、統合のプロセスが必要になる。

- ドキュメント

  >メリット：特定の機能や、APIだけを簡単にドキュメント化できる。
  >
  >デメリット：全体像を把握するには統合プロセスが必要になる。

- 再利用性

  >メリット：コンポーネントやエンドポイントの意図的分離により再利用性が向上。
  >
  >デメリット：ファイル数が増加し、検索性が低下する可能性。

これらの問題を解決するためにスクリプトや運用方法を考えていきます

## 現在の問題点

### base_opneapi.jsonが肥大化

- 一つの大きなJSONにすべてのAPIが詰め込まれている。

- ファイルサイズが大きく、スクロールも大変、コンポーネントやスキーマ、を追加したいときにも手間がかかる

### コンポーネントが複雑に絡み合っている

- $ref参照が多層的に依存しており、分離が難しい

- 完全共通化すると影響範囲が広がりすぎてリスクが高い

### API追加・修正時の手間

- 新しいAPIを追加したいときに、どのcomponentに何を足せばいいか探すのが大変。

- コンポーネントを別ファイルにしても参照関係の修正が面倒。

## 目次

前半と後半に分けて解説をしていきます

前半では巨大になったopenapi.jsonをもとにエンドポイントごとで分割します

後半では分割したOpenAPI JSON群を読み込み、再統合します

そうして１API = １JSONにすれば、改修もレビューもしやすいのでは？

コンポーネント一覧を作って、APIを追加する際にはそのコンポーネント一覧の中から部品を取得してAPIを作るような形にしようかなとかも考えたり、、、

### ディレクトリ構成

```
/openapi/
  ├── featureA/
  │    └── base_openapi.json
  ├── featureB/
  │    └── base_openapi.json
  └── generate_api_json.mjs
```

### スクリプト本体

以下が今回作ってみたスクリプトです

base_openapi.jsonを起点に、pathsごとに分割されたOpenAPI JSONを出力するようにします

```
// scripts/split-openapi.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// === パス補助 ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === CLI引数 ===
// 例: npm run split-openapi ./specs ./dist
const [inputDir, outputDir] = process.argv.slice(2);

if (!inputDir || !outputDir) {
  console.error("Usage: npm run split-openapi <inputDir> <outputDir>");
  process.exit(1);
}

// === OpenAPIファイルを探索 ===
async function findOpenAPIFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findOpenAPIFiles(fullPath)));
    } else if (entry.name.endsWith(".json") && entry.name.includes("openapi")) {
      results.push(fullPath);
    }
  }
  return results;
}

// === $refを再帰的に収集 ===
function collectRefs(obj, root, collected = {}) {
  if (!obj || typeof obj !== "object") return collected;

  if (obj.$ref) {
    const match = obj.$ref.match(/^#\/components\/([^/]+)\/(.+)$/);
    if (!match) return collected;
    const [, group, name] = match;

    if (!root.components?.[group]?.[name]) return collected;

    collected[group] = collected[group] || {};
    if (!collected[group][name]) {
      const target = root.components[group][name];
      collected[group][name] = target;
      collectRefs(target, root, collected);
    }
    return collected;
  }

  if (Array.isArray(obj)) {
    obj.forEach((v) => collectRefs(v, root, collected));
  } else {
    Object.values(obj).forEach((v) => collectRefs(v, root, collected));
  }

  return collected;
}

// === 空要素除去 ===
function cleanEmpty(obj) {
  if (Array.isArray(obj)) {
    return obj.map(cleanEmpty).filter((v) => v !== undefined && Object.keys(v || {}).length);
  } else if (typeof obj === "object" && obj !== null) {
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
      const cleaned = cleanEmpty(v);
      if (cleaned !== undefined && Object.keys(cleaned || {}).length) {
        result[k] = cleaned;
      }
    }
    return result;
  }
  return obj;
}

// === OpenAPI形式で整形 ===
function wrapAsOpenAPI(pathKey, method, info, components) {
  return {
    openapi: "3.0.3",
    info: { title: info.summary || "API", version: "1.0.0" },
    paths: { [pathKey]: { [method]: info } },
    components,
  };
}

// === 分割処理 ===
async function processOpenAPI(filePath) {
  const openapi = JSON.parse(await fs.readFile(filePath, "utf8"));
  const outputRoot = path.resolve(outputDir);
  await fs.mkdir(outputRoot, { recursive: true });

  for (const [pathKey, methods] of Object.entries(openapi.paths)) {
    for (const [method, info] of Object.entries(methods)) {
      const safeName = `${method}_${pathKey.replace(/[\\/:*?"<>|]/g, "_")}`;
      const outputPath = path.join(outputRoot, `${safeName}.json`);

      const usedComponents = collectRefs(info, openapi);
      const cleaned = cleanEmpty(usedComponents);
      const wrapped = wrapAsOpenAPI(pathKey, method, info, cleaned);

      await fs.writeFile(outputPath, JSON.stringify(wrapped, null, 2), "utf8");
    }
  }
}

// === メイン処理 ===
async function main() {
  const openapiFiles = await findOpenAPIFiles(path.resolve(inputDir));

  if (openapiFiles.length === 0) {
    console.error(`No OpenAPI files found in: ${inputDir}`);
    process.exit(1);
  }

  for (const file of openapiFiles) {
    console.log(`📄 Processing ${file}`);
    await processOpenAPI(file);
  }

  console.log(`✅ All API JSON files generated under: ${outputDir}`);
}

main().catch(console.error);
```

ちょっとわかりずらいので一つずつ見ていきます

### 処理の流れ

1. 指定された入力ディレクトリから、OpenAPI仕様openapiを含.jsonファイル）を再帰的に探します。

2. 見つけたOpenAPIファイルの内容を読み込みます。

3. ファイルpathsセクションにある各エンドポイント（例/usersGETメソッド）を個別に処理します。

4. 各エンドポイントの情報と、そのエンドポイントが参照している再利用可能なコンポーネント（$refで参照されているスキーマなど）だけを集めます。

5. 集めた情報を使って、そのエンドポイント単独のOpenAPIファイルを作成し、指定された出力ディレクトリに保存します。

これにより、大きな仕様書から、特定のAPI一つ一つに対応した小さな仕様書群が生成されます。

### 各関数の動作解説

ここからは初心者の方向け？めっちゃ細かく動作を解説します

Gemini君が手取り足取り分かりやすく教えてくれたのでせっかくだから。

#### パス補助

```
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

ES Modules(import/export)環境で、現在のファイル名とディレクトリ名を取得する為のコードです

**findOpenAPIFiles(dir)**

目的：指定されたディレクトリ以下を再帰的に探索し、名前にopenapiを含み、.jsonで終わるファイルを探し、そのフルパスのリストを返します

awaitの理由：await fs.readdir(dir, ...)でディレクトリの中身一覧の取得を待つため。再帰呼び出しの中でもawait findOpenAPIFiles(fullPath)で、子ディレクトリの探索が完了するのを待っています。

**collectRefs(obj, root, collected)**

目的：API定義情報（obj）の中から、$ref（参照）を見つけ出し、それが指し示すコンポーネント定義をルートのOpenAPIオブジェクト（root）から収集します。

動作：同期的にオブジェクトのプロパティを辿り、$refプロパティを見つけると、その参照先（例：#/components/schemas/User）をルートオブジェクトから取得し、collectedに追加します。すでに追加済みのコンポーネントの場合はスキップします。

**cleanEmpty(obj)**

目的：collectRefsで収集したコンポーネントの中には、さらに別のコンポーネントを参照しているものがあります。この関数は、収集プロセスで空になったり、不要になった要素を整理して取り除くために使います。値がはいっていない空のコンポーネントも拾ってきたりしてたので、これを入れました

**wrapAsOpenAPI(pathKey, method, info, components)**

目的：一つのAPIエンドポイントの情報（info）と、収集したコンポーネントを使って、それ単独で有効なOpenAPI仕様のJSONオブジェクトを生成します。

補足：openapiバージョン、info（タイトルとバージョン、タグ）、paths（元のパスとメソッド）、componentsを設定しています。

**processOpenAPI(filePath)**

目的：単一の大きなOpenAPIファイルを読み込み、個々のファイルに分割して書き出す処理全体を制御しています

**main()**

目的：スクリプト全体のメイン処理です。

### 出力結果（例）

```
/featureA_api/
  ├── GET_users_list.json
  ├── POST_users_create.json
  └── DELETE_users_id.json
```

それぞれのJSONは単独でSwagger Editorに読み込めます

### 統合スクリプトの目的

APIごとに分割した仕様ファイルを自動で統合することを目的としています

OpenAPIが肥大化してくると、一つのファイルで全エンドポイントを管理するのは非効率になります

このスクリプトは、APIごとに小分けされたOpenAPI JSONを自動的にマージし、共通のベース仕様書に反映することで、「分割管理」と「一元管理」の両立を実現。

### 統合スクリプト
```
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Node.js ESM 環境向けのパス取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === 引数で対象APIグループを指定 ===
// 例: npm run merge user / npm run merge product
const targetGroup = process.argv[2];
if (!targetGroup) {
  console.error("❌ 引数で対象グループを指定してください (例: user / product)");
  process.exit(1);
}

// === ディレクトリ構成 ===
// base_openapi.json: 統合結果を保持するメイン仕様
// *_api/: 個別API仕様が格納されたフォルダ
const BASE_DIR = path.join(__dirname, targetGroup);
const API_DIR = path.join(__dirname, `${targetGroup}_api`);
const BASE_FILE = path.join(BASE_DIR, "base_openapi.json");

// === JSON読み込みユーティリティ ===
async function readJSON(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

// === JSONファイルを再帰的に探索 ===
async function findAllJSON(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findAllJSON(fullPath)));
    } else if (entry.name.endsWith(".json")) {
      results.push(fullPath);
    }
  }

  return results;
}

// === OpenAPI仕様をマージ ===
function mergeOpenAPI(base, fragment, sourceName) {
  let hasChanges = false;

  // --- paths の統合 ---
  for (const [pathKey, methods] of Object.entries(fragment.paths || {})) {
    if (!base.paths[pathKey]) base.paths[pathKey] = {};

    for (const [method, info] of Object.entries(methods)) {
      const existing = base.paths[pathKey][method];
      if (!existing || JSON.stringify(existing) !== JSON.stringify(info)) {
        base.paths[pathKey][method] = info;
        console.log(`⚙️ 更新: ${pathKey} [${method}]`);
        hasChanges = true;
      }
    }
  }

  // --- components の統合 ---
  const componentKeys = [
    "schemas",
    "parameters",
    "requestBodies",
    "responses",
    "headers",
    "examples",
    "links",
    "callbacks"
  ];

  if (fragment.components) {
    base.components ||= {};

    for (const key of componentKeys) {
      const items = fragment.components[key] || {};
      base.components[key] ||= {};

      for (const [name, value] of Object.entries(items)) {
        const existing = base.components[key][name];
        if (!existing || JSON.stringify(existing) !== JSON.stringify(value)) {
          base.components[key][name] = value;
          console.log(`🧩 コンポーネント更新: ${key}.${name} (${sourceName})`);
          hasChanges = true;
        }
      }
    }
  }

  return hasChanges;
}

// === メイン処理 ===
async function main() {
  const baseOpenAPI = await readJSON(BASE_FILE);
  const apiFiles = await findAllJSON(API_DIR);
  let hasAnyChanges = false;

  for (const file of apiFiles) {
    const fragment = await readJSON(file);
    const changed = mergeOpenAPI(baseOpenAPI, fragment, path.basename(file));

    if (changed) {
      console.log(`✅ マージ完了: ${file}`);
      hasAnyChanges = true;
    }
  }

  if (!hasAnyChanges) {
    console.log("ℹ️ 変更なし: 全てのAPI仕様は最新です。");
    return;
  }

  // --- 更新反映 ---
  await fs.writeFile(BASE_FILE, JSON.stringify(baseOpenAPI, null, 2), "utf8");
  console.log(`💾 ${BASE_FILE} を更新しました。`);
}

main().catch(console.error);
```

### 処理の流れ

1. 指定されたディレクトリ配下から.jsonファイルを再帰的に検索し、各エンドポイント単位のOpenAPI仕様を収集します

2. 各JSONファイルを読み込み、以下の要素を基準にbase_openapi.jsonへ統合します。
・paths（APIエンドポイント）
・componts（共通スキーマ、リクエスト・レスポンス定義など）
差分を比較し、変更・追加がある項目のみを更新します

3. 差分が検出された場合のみ、ベースファイルを更新。差分がなければ「すべて最新状態」としてスキップする。

### 各関数の動作解説

**パス補助（File Path Helpers）**

目的：ESModules（import.meta.url）環境で、現在のファイル名（__filename）とファイルが存在するディレクトリ名（__dirname）を正確に取得する為の定型コードです。後続のパス設定の基準点として使用されます。

**CLI引数とパス設定**

目的：コマンドラインからマージ対象のグループ名を取得し、マージ元とマージ先のディレクトリおよびファイルパスを決定します

process.argv.slice(2)から最初の引数（process.argv[2]）を取り出し、引数が不足している場合はエラーで終了します。

取得したグループ名に基づき、ベースファイルのパスとAPI断片ファイル（マージ元）のディレクトリのパスを構築する

**readJSON(filePath)**

目的：指定されたパスのファイルの内容をUTF-8エンコーディングで読み込み、JSON形式としてパースして返します。

**findAllJSON(dir)**

目的：指定されたディレクトリ以下を再帰的に探索し、拡張子が.jsonであるすべてのファイルパスのリストを返します。これがマージ対象となるAPI断片ファイル群。

**meregeOpenAPI(base, fragment, sourceName)**

目的：小さなOpenAPI仕様書の内容を、大きなベースのOpenAPI仕様書に統合します

**main()**

目的：スクリプトの実行を制御し、ファイル読み込み、マージ処理、ファイル書き込みという一連の処理を実行します。

### まとめ

本記事では、プロジェクトの成長とともに肥大化するOpenAPI仕様書が引き起こす問題と、その具体的解決策について、スクリプトを交えながら解説してきました。

当初は開発効率を上げてくれたはずのOpenAPI仕様書が、いつしか２万行を超える巨大なファイルとなり、マージコンフリクトの頻発、レビューの困難さ、そして何より開発者の認知負荷を増大させる「負債」となっていました。この問題の根源は、共通ルールの欠如やモノリシックな管理体制にありました

今回は「分割統治」という古くからある設計思想に解決策を見出しました。巨大な一つのファイルをAPIエンドポイントごとに小さなJSONファイルへ分割し、「１API = １JSON」という原則を導入しました

#### 分割と統合による新しいワークフロー

このアプローチを実現するために、２つのNode.jsスクリプトを作成しました。

1. 分割スクリプト
  既存の巨大なbase_openapi.jsonをインプットし、各エンドポイントの定義と、それが依存するコンポーネント（$ref）のみを抽出した、自己完結した小さなOpenAPIファイルを自動生成します。これにより、開発者は自分が関心を持つAPIの仕様だけに集中できます。例えばログイン機能APIとか申込APIなどなど

2. 統合スクリプト
  分割・編集された個別のAPIファイルを再びbase_openapi.jsonにマージします。このスクリプトは差分のみを検知して更新します

この２つのスクリプトが連携することで、「普段の作業は分割されたファイルで行い、全体像の確認やクライアント生成は統合されたファイルで行う」という、開発サイクルが完成します

**このアプローチがもたらす未来**

「分割統治」の導入は、単にファイルを整理する以上の価値をチームにもたらします

- 開発効率の向上:マージコンフリクトが劇的に減少し、複数人での並行開発がスムーズに進みます。

- レビュー品質の向上：変更範囲が明確になるため、レビュワーは的確なフィードバックを短時間で行えるようになります。

- 再利用性の促進：依存関係が明確になったコンポーネントは、他のAPIで再利用しやすくなります。

- 持続可能なドキュメント管理：プロジェクトがどれだけ拡大しても、仕様書が管理不能に陥ることを防ぎ、長期的なメンテナンス性を確保します。

OpenAPI仕様書の肥大化は、どの現場でも発生するであろうエンジニアの悩みの種です

プロジェクトの成長とともに仕様書は膨大な量になっていきます。気づいた時にはジャイアント・セコイアのような巨大樹になっていることも...

しっかり剪定をしてあげることで盆栽ぐらいには収めておきたいですね（盆栽は盆栽で大変そうだけど）