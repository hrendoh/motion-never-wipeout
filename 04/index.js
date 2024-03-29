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
    // キーボード操作を追加
    if (this.isDebugMode) this.addListener();
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

    // シーソーを作成
    const seesawMaterial = new CANNON.Material();
    var seesawBody = new CANNON.Body({ mass: 10, material: seesawMaterial });
    seesawBody.position.set(0, 1.5, 0);
    var seesawBar = new CANNON.Box(new CANNON.Vec3(8, 0.5, 5));
    seesawBody.addShape(seesawBar, new CANNON.Vec3(0, 2, 0));
    var seesawWallF = new CANNON.Box(new CANNON.Vec3(8, 1, 0.5));
    seesawBody.addShape(seesawWallF, new CANNON.Vec3(0, 2.5, 5));
    var seesawWallB = new CANNON.Box(new CANNON.Vec3(8, 1, 0.5));
    seesawBody.addShape(seesawWallB, new CANNON.Vec3(0, 2.5, -5));
    var fulcrumCylinder = new CANNON.Cylinder(1.5, 1.5, 10, 100);
    seesawBody.addShape(fulcrumCylinder);
    this.world.addBody(seesawBody);
    this.seesawBody = seesawBody;

    // プレイヤーを作成
    const playerMaterial = new CANNON.Material();
    const playerBody = new CANNON.Body({
      mass: 10,
      material: playerMaterial
    });
    const playerCylinder = new CANNON.Cylinder(2, 2, 8, 100);
    playerBody.addShape(playerCylinder);
    playerBody.position.set(0, 6, 0);
    playerBody.linearDamping = this.damping;
    this.world.addBody(playerBody);
    this.playerBody = playerBody;

    // バー 1段目
    const bar1Material = new CANNON.Material();
    const bar1Body = new CANNON.Body({ mass: 0, material: bar1Material });
    bar1Body.position.set(0, 35, 0.5);
    const bar1Left = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 1));
    bar1Body.addShape(bar1Left, new CANNON.Vec3(-9, 0, 0));
    const bar1Center = new CANNON.Box(new CANNON.Vec3(8, 0.5, 1));
    bar1Body.addShape(bar1Center, new CANNON.Vec3(2, 0, 0));
    this.world.addBody(bar1Body);
    this.bar1Body = bar1Body;

    // バー 2段目
    const bar2Material = new CANNON.Material();
    const bar2Body = new CANNON.Body({ mass: 0, material: bar2Material });
    bar2Body.position.set(0, 30, 0.5);
    const bar2Center = new CANNON.Box(new CANNON.Vec3(8, 0.5, 1));
    bar2Body.addShape(bar2Center, new CANNON.Vec3(-2, 0, 0));
    const bar2Right = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 1));
    bar2Body.addShape(bar2Right, new CANNON.Vec3(9, 0, 0));
    this.world.addBody(bar2Body);
    this.bar2Body = bar2Body;

    const bar3Material = new CANNON.Material();
    const bar3Body = new CANNON.Body({ mass: 0, material: bar3Material });
    bar3Body.position.set(0, 25, 0.5);
    const bar3Left = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 1));
    bar3Body.addShape(bar3Left, new CANNON.Vec3(-10, 0, 0));
    const bar3Center = new CANNON.Box(new CANNON.Vec3(8, 0.5, 1));
    bar3Body.addShape(bar3Center, new CANNON.Vec3(1, 0, 0));
    this.world.addBody(bar3Body);
    this.bar3Body = bar3Body;

    const bar4Material = new CANNON.Material();
    const bar4Body = new CANNON.Body({ mass: 0, material: bar4Material });
    bar4Body.position.set(0, 20, 0.5);
    const bar4Center = new CANNON.Box(new CANNON.Vec3(8, 0.5, 1));
    bar4Body.addShape(bar4Center, new CANNON.Vec3(-1, 0, 0));
    const bar4Right = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 1));
    bar4Body.addShape(bar4Right, new CANNON.Vec3(10, 0, 0));
    this.world.addBody(bar4Body);
    this.bar4Body = bar4Body;
  }

  animate() {
    requestAnimationFrame(() => {
      this.animate();
    });
    this.world.step(this.fixedTimeStep);
    if (this.debugRenderer !== undefined) this.debugRenderer.update();
    this.renderer.render(this.scene, this.camera);

    this.playerBody.velocity.x = 0;

    const axisAngle = this.seesawBody.quaternion.toAxisAngle();
    this.bar1Body.quaternion.setFromAxisAngle(axisAngle[0], axisAngle[1]);
    this.bar2Body.quaternion.setFromAxisAngle(axisAngle[0], axisAngle[1]);
    this.bar3Body.quaternion.setFromAxisAngle(axisAngle[0], axisAngle[1]);
    this.bar4Body.quaternion.setFromAxisAngle(axisAngle[0], axisAngle[1]);
  }

  addListener() {
    window.addEventListener("keydown", e => {
      switch (e.keyCode) {
        case 37: // 右矢印のキーコード
          // 右に曲がるイベント
          if (this.playerBody.position.x >= -5)
            this.playerBody.position.x -= 1;
          break;
        case 39: // 左矢印のキーコード
          // 左に曲がるイベントト
          if (this.playerBody.position.x <= 5)
            this.playerBody.position.x += 1;
          break;
      }
    });
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
