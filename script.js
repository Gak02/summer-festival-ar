// グローバル変数
let scene, camera, renderer, arToolkitSource, arToolkitContext;
let markerRoot;
let fireworkSystem;
let eventLogo;
let isLogoVisible = true;
let isARReady = false;

// 花火の色配列
const fireworkColors = [
    0xFF6B6B, // 赤
    0x4ECDC4, // 青緑
    0xFFD93D, // 黄
    0x6BCF7F, // 緑
    0xFF8C42, // オレンジ
    0x845EC2, // 紫
    0xF9F871  // 明るい黄
];

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    initializeAR();
    setupEventListeners();
});

// AR初期化
function initializeAR() {
    // Scene作成
    scene = new THREE.Scene();

    // Camera設定
    camera = new THREE.Camera();
    scene.add(camera);

    // Renderer設定
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true
    });
    renderer.setClearColor(new THREE.Color('lightgrey'), 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0px';
    renderer.domElement.style.left = '0px';
    
    document.getElementById('arContainer').appendChild(renderer.domElement);

    // AR.js Source設定（カメラ）
    arToolkitSource = new THREEx.ArToolkitSource({
        sourceType: 'webcam',
        sourceWidth: window.innerWidth > 480 ? 480 : 320,
        sourceHeight: window.innerWidth > 480 ? 640 : 240,
    });

    // AR.js Context設定
    arToolkitContext = new THREEx.ArToolkitContext({
        cameraParametersUrl: 'https://ar-js-org.github.io/AR.js/data/data/camera_para.dat',
        detectionMode: 'mono'
    });

    // マーカールート作成
    markerRoot = new THREE.Group();
    scene.add(markerRoot);

    // ARマーカー設定
    new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
        type: 'pattern',
        patternUrl: 'https://ar-js-org.github.io/AR.js/data/data/patt.hiro'
    });

    // コンポーネント初期化
    initializeComponents();

    // AR開始
    arToolkitSource.init(() => {
        arToolkitSource.domElement.style.position = 'absolute';
        arToolkitSource.domElement.style.top = '0px';
        arToolkitSource.domElement.style.left = '0px';

        // カメラ初期化完了後の処理
        setTimeout(() => {
            onResize();
            hideLoadingScreen();
        }, 2000);
    }, (error) => {
        console.error('Camera initialization error:', error);
        showErrorMessage();
    });

    arToolkitContext.init(() => {
        camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
        isARReady = true;
    });

    // リサイズ対応
    window.addEventListener('resize', onResize);
}

// コンポーネント初期化
function initializeComponents() {
    // ロゴ作成
    createEventLogo();
    
    // 花火システム初期化
    fireworkSystem = new FireworkSystem();
    
    // ライト追加
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    markerRoot.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    markerRoot.add(directionalLight);
}

// イベントロゴ作成
function createEventLogo() {
    // テキストでロゴを作成（画像を使う場合はTextureLoaderを使用）
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;

    // グラデーション背景
    const gradient = context.createLinearGradient(0, 0, 512, 0);
    gradient.addColorStop(0, '#FF6B6B');
    gradient.addColorStop(0.5, '#4ECDC4');
    gradient.addColorStop(1, '#FFD93D');

    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 256);

    // テキスト描画
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 36px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('🎆 夏祭り 2025 🎆', 256, 100);
    
    context.font = 'bold 24px Arial';
    context.fillText('人事イベント', 256, 150);

    // 枠線
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 4;
    context.strokeRect(0, 0, 512, 256);

    // テクスチャ作成
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    // ロゴメッシュ作成
    const logoGeometry = new THREE.PlaneGeometry(3, 1.5);
    const logoMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
    });

    eventLogo = new THREE.Mesh(logoGeometry, logoMaterial);
    eventLogo.position.set(0, 2, 0);
    markerRoot.add(eventLogo);
}

// 花火システムクラス
class FireworkSystem {
    constructor() {
        this.fireworks = [];
        this.particles = [];
        this.particleGeometry = new THREE.BufferGeometry();
        this.particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        });
        
        this.particleSystem = new THREE.Points(this.particleGeometry, this.particleMaterial);
        markerRoot.add(this.particleSystem);
        
        this.initializeParticles();
    }

    initializeParticles() {
        const maxParticles = 1000;
        const positions = new Float32Array(maxParticles * 3);
        const colors = new Float32Array(maxParticles * 3);
        const velocities = new Float32Array(maxParticles * 3);
        const lifetimes = new Float32Array(maxParticles);

        this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        this.particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        this.particleGeometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
    }

    createFirework(x = 0, y = 2, z = 0) {
        const particleCount = 50;
        const color = new THREE.Color(fireworkColors[Math.floor(Math.random() * fireworkColors.length)]);
        
        const firework = {
            particles: [],
            startTime: Date.now(),
            duration: 3000,
            color: color
        };

        // パーティクル生成
        for (let i = 0; i < particleCount; i++) {
            const particle = {
                position: new THREE.Vector3(x, y, z),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 6,
                    Math.random() * 4 + 1,
                    (Math.random() - 0.5) * 6
                ),
                life: 1.0,
                initialLife: 1.0,
                color: color.clone(),
                size: Math.random() * 0.1 + 0.05
            };
            firework.particles.push(particle);
        }

        this.fireworks.push(firework);
        this.updateParticleSystem();
    }

    update() {
        const currentTime = Date.now();
        
        // 期限切れの花火を削除
        this.fireworks = this.fireworks.filter(firework => {
            const elapsed = currentTime - firework.startTime;
            return elapsed < firework.duration;
        });

        // 全ての花火のパーティクルを更新
        this.fireworks.forEach(firework => {
            const elapsed = (currentTime - firework.startTime) / 1000;
            
            firework.particles.forEach(particle => {
                // 重力適用
                particle.velocity.y -= 0.01;
                
                // 空気抵抗
                particle.velocity.multiplyScalar(0.995);
                
                // 位置更新
                particle.position.add(particle.velocity.clone().multiplyScalar(0.016));
                
                // 生命値減少
                particle.life = Math.max(0, particle.initialLife - elapsed / 3);
                
                // 色のフェード
                particle.color.multiplyScalar(0.998);
            });
        });

        this.updateParticleSystem();
    }

    updateParticleSystem() {
        const positions = this.particleGeometry.attributes.position.array;
        const colors = this.particleGeometry.attributes.color.array;
        let particleIndex = 0;

        // 全てのパーティクルをリセット
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] = 0;
            positions[i + 1] = 0;
            positions[i + 2] = 0;
            colors[i] = 0;
            colors[i + 1] = 0;
            colors[i + 2] = 0;
        }

        // アクティブなパーティクルを描画
        this.fireworks.forEach(firework => {
            firework.particles.forEach(particle => {
                if (particle.life > 0 && particleIndex < positions.length / 3) {
                    const index = particleIndex * 3;
                    
                    positions[index] = particle.position.x;
                    positions[index + 1] = particle.position.y;
                    positions[index + 2] = particle.position.z;
                    
                    colors[index] = particle.color.r * particle.life;
                    colors[index + 1] = particle.color.g * particle.life;
                    colors[index + 2] = particle.color.b * particle.life;
                    
                    particleIndex++;
                }
            });
        });

        this.particleGeometry.attributes.position.needsUpdate = true;
        this.particleGeometry.attributes.color.needsUpdate = true;
        this.particleGeometry.setDrawRange(0, particleIndex);
    }
}

// イベントリスナー設定
function setupEventListeners() {
    // 花火ボタン
    document.getElementById('firework-btn').addEventListener('click', () => {
        if (isARReady) {
            const x = (Math.random() - 0.5) * 4;
            const y = Math.random() * 2 + 1.5;
            const z = (Math.random() - 0.5) * 3;
            
            fireworkSystem.createFirework(x, y, z);
            
            // ボタンアニメーション
            const btn = document.getElementById('firework-btn');
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 100);
        }
    });

    // ロゴ表示切替
    document.getElementById('toggle-logo').addEventListener('click', () => {
        if (eventLogo) {
            isLogoVisible = !isLogoVisible;
            eventLogo.visible = isLogoVisible;
            
            const btn = document.getElementById('toggle-logo');
            btn.textContent = isLogoVisible ? '🏮 ロゴ表示切替' : '🏮 ロゴを表示';
        }
    });

    // マーカーモーダル
    document.getElementById('show-marker').addEventListener('click', () => {
        document.getElementById('marker-modal').style.display = 'block';
    });

    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('marker-modal').style.display = 'none';
    });

    // モーダル外クリックで閉じる
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('marker-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // 画面タップで花火
    renderer.domElement.addEventListener('touchstart', (event) => {
        event.preventDefault();
        if (isARReady && event.touches.length === 1) {
            document.getElementById('firework-btn').click();
        }
    });
}

// アニメーションループ
function animate() {
    requestAnimationFrame(animate);

    if (arToolkitSource && arToolkitSource.ready !== false) {
        arToolkitContext.update(arToolkitSource.domElement);
    }

    // ロゴアニメーション
    if (eventLogo && isLogoVisible) {
        const time = Date.now() * 0.001;
        eventLogo.rotation.y = Math.sin(time) * 0.1;
        eventLogo.position.y = 2 + Math.sin(time * 2) * 0.1;
    }

    // 花火システム更新
    if (fireworkSystem) {
        fireworkSystem.update();
    }

    renderer.render(scene, camera);
}

// リサイズ処理
function onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (arToolkitSource && arToolkitSource.domElement) {
        arToolkitSource.onResizeElement();
        arToolkitSource.copyElementSizeTo(renderer.domElement);
        
        if (arToolkitContext && arToolkitContext.arController !== null) {
            arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
        }
    }

    renderer.setSize(width, height);
    
    if (camera && arToolkitContext) {
        camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
    }
}

// ローディング画面を隠す
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.opacity = '0';
    loadingScreen.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        animate(); // アニメーション開始
    }, 500);
}

// エラーメッセージ表示
function showErrorMessage() {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('error-message').style.display = 'flex';
}

// デバッグ用関数
function debugInfo() {
    console.log('AR Ready:', isARReady);
    console.log('Camera:', camera);
    console.log('Scene children:', scene.children.length);
    console.log('Marker visible:', markerRoot.visible);
}

// グローバルに関数を公開（デバッグ用）
window.createFirework = () => fireworkSystem?.createFirework();
window.debugInfo = debugInfo;