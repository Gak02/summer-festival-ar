# 夏祭りWebARフィルター 🎆

人事イベント用の夏祭りテーマWebARアプリケーションです。AR.js + Three.jsを使用して、花火エフェクトとイベントロゴを表示します。

## 🌟 特徴

- **マーカーベースAR**: HIROマーカーを使用した安定したAR体験
- **花火エフェクト**: タップで美しい花火を打ち上げ
- **イベントロゴ**: カスタマイズ可能なロゴ表示
- **モバイル対応**: iOS Safari / Android Chrome対応
- **無料**: AR.js + Three.jsで完全無料

## 📱 対応デバイス

### iOS
- iPhone 7 以降
- iOS 11.3 以降
- Safari ブラウザ

### Android
- Android 7.0 以降
- Chrome ブラウザ
- WebRTC対応デバイス

## 🚀 セットアップ手順

### 1. ファイル構成

```
summer-festival-ar/
├── index.html       # メインHTMLファイル
├── script.js        # JavaScript実装
├── style.css        # スタイルシート
├── README.md        # このファイル
└── assets/          # 素材フォルダ（オプション）
    ├── logo.png     # カスタムロゴ（オプション）
    └── sounds/      # 効果音（オプション）
```

### 2. HTTPSサーバーでの公開

WebARはHTTPS環境が必須です。以下のいずれかの方法で公開してください：

#### GitHub Pagesを使用（推奨・無料）

1. GitHubアカウント作成
2. 新しいリポジトリ作成: `summer-festival-ar`
3. ファイルをアップロード
4. Settings → Pages → Source: `Deploy from a branch`
5. Branch: `main` を選択
6. 公開URL: `https://[username].github.io/summer-festival-ar`

#### Netlifyを使用（無料）

1. [Netlify](https://netlify.com)にアカウント作成
2. プロジェクトフォルダをドラッグ&ドロップ
3. 自動で公開URL生成

#### Vercelを使用（無料）

1. [Vercel](https://vercel.com)にアカウント作成
2. GitHubリポジトリと連携
3. 自動デプロイ

### 3. ローカル開発環境（テスト用）

```bash
# Node.jsがインストール済みの場合
npx http-server -S -C cert.pem -K key.pem -p 8080

# Pythonがインストール済みの場合（Python 3）
python -m http.server 8080

# 注意: ローカル開発時もHTTPS必須
```

## 🎯 使用方法

### 基本的な使い方

1. **マーカー準備**
   - アプリ内の「❓ マーカー表示」ボタンをタップ
   - HIROマーカーをダウンロード・印刷
   - A4サイズで印刷推奨

2. **AR体験開始**
   - ブラウザでアプリURLにアクセス
   - カメラアクセス許可
   - マーカーにカメラを向ける

3. **エフェクト操作**
   - 「🎇 花火を打ち上げる」ボタンまたは画面タップで花火発射
   - 「🏮 ロゴ表示切替」でロゴの表示・非表示切替

### イベントでの活用方法

#### 事前準備
1. QRコード作成（公開URLから）
2. マーカーを会場に設置またはカードとして配布
3. 参加者への使用方法説明

#### 運用案
- **フォトスポット**: マーカーを設置してAR撮影コーナー作成
- **SNS連携**: #ハッシュタグでの投稿促進
- **コンテスト**: AR写真コンテスト開催

## ⚙️ カスタマイズ

### ロゴの変更

`script.js`の`createEventLogo()`関数を編集：

```javascript
// テキストを変更
context.fillText('🎆 あなたのイベント名 🎆', 256, 100);
context.fillText('会社名・部署名', 256, 150);

// 画像を使用する場合
const logoTexture = new THREE.TextureLoader().load('assets/your-logo.png');
```

### 花火の色変更

`script.js`の`fireworkColors`配列を編集：

```javascript
const fireworkColors = [
    0xFF6B6B, // 赤
    0x4ECDC4, // 青緑  
    0xYOURCOLOR, // あなたの色
];
```

### UIテーマ変更

`style.css`の色設定を変更：

```css
/* メインカラー変更 */
.festival-button {
    background: linear-gradient(45deg, #YOUR_COLOR1, #YOUR_COLOR2);
}
```

## 🔧 トラブルシューティング

### よくある問題

#### カメラが起動しない
- **原因**: HTTPS接続でない
- **解決**: HTTPS環境で公開し直す

#### マーカーが認識されない  
- **原因**: 照明不足、マーカーサイズ、角度
- **解決**: 明るい場所で正面からマーカーを映す

#### 花火が表示されない
- **原因**: WebGL未対応、性能不足
- **解決**: 新しいデバイス・ブラウザを使用

#### パフォーマンスが悪い
- **原因**: パーティクル数過多
- **解決**: `script.js`の`maxParticles`値を減らす

### デバッグ機能

開発者ツールのコンソールで以下を実行：

```javascript
// AR状態確認
debugInfo();

// 手動花火発射
createFirework();
```

## 📊 パフォーマンス最適化

### 推奨設定

```javascript
// パーティクル数調整（script.js）
const maxParticles = 500; // 低性能デバイス用

// テクスチャサイズ削減
canvas.width = 256;  // 512 → 256
canvas.height = 128; // 256 → 128
```

### モニタリング

```javascript
// FPS表示（オプション）
const stats = new Stats();
document.body.appendChild(stats.dom);

// アニメーションループに追加
function animate() {
    stats.begin();
    // ... existing code
    stats.end();
}
```

## 🎨 追加機能のアイデア

### 実装可能な機能
- **音響効果**: Web Audio APIで花火音
- **写真撮影**: canvas.toDataURL()でスクリーンショット
- **SNS投稿**: Web Share APIで共有機能
- **複数マーカー**: 異なるエフェクトの追加
- **アニメーション**: ロゴの複雑なアニメーション

### 高度な機能
- **顔認識**: MediaPipe Face Detectionとの組み合わせ
- **背景除去**: BodyPixでの人物切り抜き
- **リアルタイム配信**: WebRTCでのライブ配信

## 📝 ライセンス

このプロジェクトはMITライセンスです。商用・非商用問わず自由に使用できます。

### 利用ライブラリ
- **Three.js**: MIT License
- **AR.js**: MIT License

## 🤝 サポート

### 技術サポート
- [AR.js Documentation](https://ar-js-org.github.io/AR.js-Docs/)
- [Three.js Documentation](https://threejs.org/docs/)

### コミュニティ
- AR.js GitHub Issues
- Three.js Community

---

**開発者**: WebAR Development Team  
**バージョン**: 1.0.0  
**最終更新**: 2025年8月

🎆 素晴らしい夏祭りイベントをお楽しみください！ 🎆