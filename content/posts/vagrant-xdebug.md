---
number: 0
slug: "vagrant-xdebug"
tags:
  - "TECH"
date: "2025-01-01"
updated: "2026-01-01"
location: ""
title: "Vagrant 環境で Xdebug をソースインストールしようとして cannot run C compiled programs が出る理由と対処法"
description: "Xdebug本当にありがとう"
metaTags:
  - ""
coverImage: "/images/posts/TECH/linux_pen.png"
featured: false
draft: false
---



どうも、Xdebugの導入してから見える景色が段違いになりました

依存関係がぐちゃぐちゃになっているスパゲッティを紐解いていくときに var_dump()でデバッガしてたのが遠い日のように思い出せます

Xdebugを導入した日には、自分の中での産業革命が起こりましたね

まあデバッガのありがたさを語るのはこの辺にして、そのXdebugをVagrant環境に入れる手順で躓いたところがあったのでまとめてみました

## 導入

Xdebugを導入するのには公式サイトから、自分の環境の言語情報？を送信すれば、手順を書いてくれます。以下が自分の場合の手順でした

1. Download xdebug-3.1.6.tgz

2. Install the pre-requisites for compiling PHP extensions. These packages are often called 'php-dev', or 'php-devel', 'automake' and 'autoconf'.

3. Unpack the downloaded file with tar -xvzf xdebug-3.1.6.tgz

4. Run: cd xdebug-3.1.6

5. Run: phpize (See the FAQ if you don't have phpize).
    As part of its output it should show:
    ```
    Configuring for:
    ...
    Zend Module Api No:      20190902
    Zend Extension Api No:   320190902
    ```
    If it does not, you are using the wrong phpize. Please follow this FAQ entry and skip the next step.

6. Run: ./configure

7. Run: make

8. Run: cp modules/xdebug.so /usr/lib64/php/modules/

9. Create /etc/php.d/99-xdebug.ini and add the line:
  zend_extension = xdebug

Vagrant環境でXdebugを使ってPHPの開発を行っているのですが、ソースからインストールした際に、

```
[vagrant@centos9s xdebug-3.1.6]$ ./configure
checking for grep that handles long lines and -e... /usr/bin/grep
checking for egrep... /usr/bin/grep -E
checking for a sed that does not truncate output... /usr/bin/sed
checking for pkg-config... /usr/bin/pkg-config
checking pkg-config is at least version 0.9.0... yes
checking for cc... cc
checking whether the C compiler works... yes
checking for C compiler default output file name... a.out
checking for suffix of executables...
checking whether we are cross compiling... configure: error: in `/vagrant/xdebug-3.1.6':
configure: error: cannot run C compiled programs.
If you meant to cross compile, use `--host'.
See `config.log' for more details
```

のエラーが発生しました

このエラーの原因ですが、「共有マウント領域でのバイナリ実行制限」でLinux側の制約でした

## 発生状況

Vagrant + VirtualBox環境で Centosを利用しているのですが、共有ディレクト/vagrant 上でXdebugのソースを./configureすると、次のエラーが発生しました

**configure: error: cannot run C compiled programs.**

一見すると「Cコンパイラが壊れている」「phpizeが間違っている」と思いがちですが、コンパイラまでは成功して、実行が禁止されていることが原因でした。

## なぜこのエラーが発生するのか

`./configure` は内部でテスト用のCプログラムをコンパイルし、そのまま即座に実行して環境を検証します

しかし、Vagrant共有ディレクトリ `/vagrant` はVirtualBox側の仕様で、デフォルトで以下のマウントオプションが付与されています

**noexec**

これは「ディレクトリ上のファイルはLinuxカーネルに実行(exec)させない」という制約です。実行テストがブロックされるため`cannot run C compiled programs`が発生します

Cコンパイラが壊れているのではなく、実行権限が最初から奪われている場所`./configure`を走らせているのが原因でした

[stack overflow](https://stackoverflow.com/questions/24152521/pycrypto-installation-configure-error-cannot-run-c-compiled-programs) でも同様の事象が確認されました

## Linuxでの２つの典型的な解決路

stack overflowの記事では二通りの解決策を紹介していました

1. 一時的にremount してexec許可
  ```
  sudo mount -o remount.rw.exec /tmp
  ```

2. ビルドディレクトリをexec許可のあるホーム配下などに移す
  ```
  mkdir -p ~/build; cd ~/build; ...
  ```

自分は②で対応しました

## 対処法

ビルドに使用するディレクトリ/vagrantなどの共有領域ではなく/tmp/usr/local/srcといった実行権限のある場所に移すことで解決しました

```
cd /tmp
cp -r /vagrant/xdebug-3.1.6 .
cd xdebug-3.1.6
phpize
./configure
make
```


## /tmpで動く理由

`/tmp`はLinuxの標準一時ディレクトリであり、多くのビルド・一時ファイル用途で"実行可能"な領域として設定されています。ここにはnoexecが設定されていないため、コンパイルしたテストバイナリがその場で実行でき`./configure`が通過します

ですがstack overflowの場`/tmp`が**noexec**になっている、逆パターンのようです

今回

`/vagrant`が**noexec**だった

stack overflowの場合

`/tmp`側がnoexecだった

tmpもnoexecかexecかはディストリビューションのセキュリティポリシー依存なので、ビルド場所が`/tmp`が万能とは限らないみたいですね

## まとめ

`/vagrant`は共有ディレクトリであり、VirtualBoxにより**noexec**でマウントされる

`./configure`はコンパイルしたCプログラムを即実行するため、**noexec**だと失敗する

対処法はビルドディレクトリtmp/user/loal/srcに移動するか、一時的にremountしてexec許可する

Xdebug以外のソースビルドでもある躓きポイントを回避できるように整理できたと思います

## 参考資料

Xdebug 公式サイト

https://xdebug.org/wizard

pycrypto installation: configure error: cannot run C compiled programs

https://stackoverflow.com/questions/24152521/pycrypto-installation-configure-error-cannot-run-c-compiled-programs

Tux © Larry Ewing

Source: Wikimedia Commons

