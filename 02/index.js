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

    if (this.isDebugMode) {
      // デバッグモードの場合は、カメラの向きを変えられるようにする
      this.controls = new THREE.OrbitControls(this.camera);

      // デバッグ用のXYZ軸を表示
      const axis = new THREE.AxisHelper(1000);
      this.scene.add(axis);
    }

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

    // 剛体を生成し配置
    this.initPhysics();
    // アニメーションを開始
    this.animate();
  }

  initPhysics() {
    const world = new CANNON.World();
    this.world = world;
    this.fixedTimeStep = 1.0 / 60.0;
    this.damping = 0.01;

    world.broadphase = new CANNON.NaiveBroadphase();
    world.gravity.set(0, -10, 0);

    if (this.isDebugMode)
      this.debugRenderer = new THREE.CannonDebugRenderer(
        this.scene,
        this.world
      );

    // 地面
    const groundMaterial = new CANNON.Material("ground");
    const groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
    groundBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    );
    const groundShape = new CANNON.Plane();
    groundBody.addShape(groundShape);
    this.world.add(groundBody);

    // ボール
    const sphereMaterial = new CANNON.Material("ball");
    const sphereBody = new CANNON.Body({
      mass: 10,
      material: sphereMaterial
    });
    const sphere = new CANNON.Sphere(1);
    sphereBody.addShape(sphere);
    sphereBody.position.set(0, 40, 0.5);
    sphereBody.linearDamping = this.damping;
    this.world.addBody(sphereBody);
  }

  animate() {
    requestAnimationFrame(() => {
      this.animate();
    });
    this.world.step(this.fixedTimeStep);
    if (this.debugRenderer !== undefined) this.debugRenderer.update();
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener(
  "load",
  () => {
    const game = new Game();
    game.init();
  },
  false
);
