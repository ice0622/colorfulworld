---
number: 0
slug: "vercel-upstash-redis"
tags:
  - "TECH"
date: "2025-11-06"
updated: "2026-04-23"
location: ""
title: "Vercel で Upstash Redis を作ったけど削除できない問題"
description: "何回もAPI叩いてもうまくいかなかった。。。"
metaTags:
  - ""
coverImage: "/images/posts/TECH/public.jpg"
featured: false
draft: false
---

## 結論

- Upstash APIでは削除できない（Vercel経由だと Developer API が使えないから）

- 削除するには Vercel 側の Integration をUninstall する必要がある

- 環境変数が手動削除できない

## ハマったポイント

- Upstash の DeveloperAPIを使っていろいろ削除を試したけどうまくいかない（database id が取得できなかったり、認証が出来なかったり）

- 環境変数を削除しようとしたところ、以下のポップアップが出てきた

    >You can remove this environment variable by disconnecting the project from the connected store
    >
    >この環境変数は、接続されているストア（＝外部サービス）との連携を解除することで削除できます。

- ドキュメントを読み直したら小さく注意書きがあった

    >The Developer API is only available to native Upstash accounts.
    >
    >Accounts created via third-party platforms like Vercel or Fly.io are not supported.
    >
    >Developer API は、Upstash に直接作成された（ネイティブ）アカウントでのみ利用できます。
    >Vercel や Fly.io などのサードパーティプラットフォーム経由で作成されたアカウントでは利用できません。

## なぜ API が使えないのか？

- Vercel が「代理管理者」として Upstash DB を作る仕組みだから Upstash 側で削除できない

- Upstashダッシュボードでアカウントの設定が存在しない

- Logoutの項目しかないため、API Keyが作れない

## 正しい削除手順

1. Vecel Dashboardを開く

    ![](/images/posts/vercel-redis/1.png)

2. Integrationsを開く

    ![](/images/posts/vercel-redis/2.png)

3. Upstashを選択する

    ![](/images/posts/vercel-redis/3.png)

4. 解除したいリソースを選択する

    ![](/images/posts/vercel-redis/4.png)

5. 手順に沿って統合サービスを解除する

    ![](/images/posts/vercel-redis/5.png)

6. 自動で Upstash 側の DB も削除される

    ![](/images/posts/vercel-redis/6.png)

7. 自動生成されてた環境変数も消える

## 今回学んだこと

- Vercel経由で作成されたDBはUpstashの「ネイティブ」扱いではない

- APIドキュメントしっかり読もうね

- Integrationsの削除 = リソースの削除という仕様を覚えておく
