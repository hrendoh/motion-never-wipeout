class Game {
  constructor() {
    this.isDebugMode = true;
  }

  init() {
    this.scene = new THREE.Scene();

    // 画面サイズ
    const gameScreenWidth = window.innerWidth;
    const gameScreeenHight = window.innerHeight;
    const aspectRatio = gameScreenWidth / gameScreeenHight;

    this.camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 1000);
    this.camera.lookAt(this.scene.position);
     // カメラの位置は開発しやすい高さをセット
    this.camera.position.z = 50;
    this.camera.position.y = 20;

    // WebGLRendererの初期化し、CanvasをDOMに追加
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(gameScreenWidth, gameScreeenHight);
    const gameContainer = document.getElementById("game");
    gameContainer.appendChild(this.renderer.domElement);

    // ライトの初期化
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 20, 10);
    const ambient = new THREE.AmbientLight(0x707070);
    this.scene.add(light);
    this.scene.add(ambient);

    // ゲームの壁を作成
    const wallGeometry = new THREE.BoxGeometry(24, 40, 1);
    const wallMaterial = new THREE.MeshPhongMaterial({ color: 0xffff66 });
    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
    wallMesh.position.set(0, 20, -1);
    this.scene.add(wallMesh);

    // アニメーションを開始
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => {
      this.animate();
    });
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('load', () => {
  const game = new Game();
  game.init();
}, false);
