// グローバル変数
let scene, camera, renderer;
let arToolkitSource, arToolkitContext, arMarkerControls;
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
    // ライブラリ読み込み確認
    if (typeof THREE === 'undefined') {
        console.error('Three.js not loaded');
        showErrorMessage('Three.js library failed to load');
        return;
    }

    // AR.jsの読み込み確認（少し遅らせる）
    setTimeout(() => {
        if (typeof THREEx === 'undefined') {
            console.error('AR.js not loaded, trying alternative initialization');
            showErrorMessage('AR.js library failed to load');
            return;
        }
        initializeAR();
        setupEventListeners();
    }, 1000);
});

// AR初期化
function initializeAR() {
    try {
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
            sourceWidth: 640,
            sourceHeight: 480,
            displayWidth: window.innerWidth,
            displayHeight: window.innerHeight,
        });

        // AR.js Context設定
        arToolkitContext = new THREEx.ArToolkitContext({
            cameraParametersUrl: 'https://ar-js-org.github.io/AR.js/data/data/camera_para.dat',
            detectionMode: 'mono',
            matrixCodeType: '3x3',
            canvasWidth: 640,
            canvasHeight: 480,
        });

        // マーカールート作成
        markerRoot = new THREE.Group();
        scene.add(markerRoot);

        // ARマーカー設定
        arMarkerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
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

            setTimeout(() => {
                onResize();
                hideLoadingScreen();
            }, 2000);
        }, (error) => {
            console.error('Camera initialization error:', error);
            showErrorMessage('Camera access failed. Please allow camera access and reload.');
        });

        arToolkitContext.init(() => {
            camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
            isARReady = true;
            console.log('AR initialized successfully');
        });

        // リサイズ対応
        window.addEventListener('resize', onResize);

    } catch (error) {
        console.error('AR initialization failed:', error);
        showErrorMessage('AR initialization failed: ' + error.message);
    }
}

// コンポーネント初期化
function initializeComponents() {
    try {
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

        console.log('Components initialized successfully');
    } catch (error) {
        console.error('Component initialization failed:', error);
    }
}

// イベントロゴ作成
function createEventLogo() {
    try {
        // テキストでロゴを作成
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

        console.log('Logo created successfully');
    } catch (error) {
        console.error('Logo creation failed:', error);
    }
}

// 花火システムクラス
class FireworkSystem {
    constructor() {
        try {
            this.fireworks = [];
            this.particles = [];
            
            // パーティクルジオメトリとマテリアル
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
            console.log('Firework system initialized');
        } catch (error) {
            console.error('Firework system initialization failed:', error);
        }
    }

    initializeParticles() {
        const maxParticles = 500; // パフォーマンス考慮して削減
        const positions = new Float32Array(maxParticles * 3);
        const colors = new Float32Array(maxParticles * 3);

        this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }

    createFirework(x = 0, y = 2, z = 0) {
        try {
            const particleCount = 30; // パフォーマンス考慮
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
                        (Math.random() - 0.5) * 4,
                        Math.random() * 3 + 1,
                        (Math.random() - 0.5) * 4
                    ),
                    life: 1.0,
                    initialLife: 1.0,
                    color: color.clone()
                };
                firework.particles.push(particle);
            }

            this.fireworks.push(firework);
            this.updateParticleSystem();
            console.log('Firework created at', x, y, z);
        } catch (error) {
            console.error('Firework creation failed:', error);
        }
    }

    update() {
        try {
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
        } catch (error) {
            console.error('Firework update failed:', error);
        }
    }

    updateParticleSystem() {
        try {
            const positions = this.particleGeometry.attributes.position.array;
            const colors = this.particleGeometry.attributes.color.array;
            let particleIndex = 0;

            // 全てのパーティクルをリセット
            positions.fill(0);
            colors.fill(0);

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
        } catch (error) {
            console.error('Particle system update failed:', error);
        }
    }
}

// イベントリスナー設定
function setupEventListeners() {
    // 花火ボタン
    document.getElementById('firework-btn').addEventListener('click', () => {
        if (isARReady && fireworkSystem) {
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
    if (renderer && renderer.domElement) {
        renderer.domElement.addEventListener('touchstart', (event) => {
            event.preventDefault();
            if (isARReady && event.touches.length === 1) {
                document.getElementById('firework-btn').click();
            }
        });
    }
}

// アニメーションループ
function animate() {
    requestAnimationFrame(animate);

    try {
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

        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    } catch (error) {
        console.error('Animation loop error:', error);
    }
}

// リサイズ処理
function onResize() {
    try {
        const width = window.innerWidth;
        const height = window.innerHeight;

        if (arToolkitSource && arToolkitSource.domElement) {
            arToolkitSource.onResizeElement();
            arToolkitSource.copyElementSizeTo(renderer.domElement);
            
            if (arToolkitContext && arToolkitContext.arController !== null) {
                arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
            }
        }

        if (renderer) {
            renderer.setSize(width, height);
        }
        
        if (camera && arToolkitContext) {
            camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
        }
    } catch (error) {
        console.error('Resize error:', error);
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
function showErrorMessage(message = 'An error occurred') {
    document.getElementById('loading-screen').style.display = 'none';
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.querySelector('p').textContent = message;
        errorDiv.style.display = 'flex';
    }
}

// デバッグ用関数
function debugInfo() {
    console.log('=== Debug Info ===');
    console.log('AR Ready:', isARReady);
    console.log('THREE available:', typeof THREE !== 'undefined');
    console.log('THREEx available:', typeof THREEx !== 'undefined');
    console.log('Scene children:', scene ? scene.children.length : 'Scene not initialized');
    console.log('Marker visible:', markerRoot ? markerRoot.visible : 'MarkerRoot not initialized');
    console.log('Renderer size:', renderer ? renderer.getSize(new THREE.Vector2()) : 'Renderer not initialized');
}

// グローバルに関数を公開（デバッグ用）
window.createFirework = () => fireworkSystem?.createFirework();
window.debugInfo = debugInfo;
