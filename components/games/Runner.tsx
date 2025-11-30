import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BaseGameProps } from '../../types';
import { audioService } from '../../services/audioService';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';

export const Runner: React.FC<BaseGameProps> = ({ onExit }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Refs for game state accessible inside loop
  const stateRef = useRef({
    lane: 0, // -1, 0, 1
    speed: 0.2,
    score: 0,
    isPlaying: false,
    gameOver: false,
    jumping: false,
    jumpVel: 0,
    y: 0
  });

  const requestRef = useRef<number | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // SCENE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 10, 50);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 3, 5);
    camera.lookAt(0, 0, -5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // LIGHTS
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(3, 10, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // PLAYER
    const playerGeo = new THREE.BoxGeometry(0.8, 1, 0.8);
    const playerMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const player = new THREE.Mesh(playerGeo, playerMat);
    player.position.y = 0.5;
    scene.add(player);

    // FLOOR (Infinite look)
    const floorGeo = new THREE.PlaneGeometry(20, 1000);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -400;
    scene.add(floor);

    // OBJECTS POOL
    const obstacles: THREE.Mesh[] = [];
    const coins: THREE.Mesh[] = [];
    const obsGeo = new THREE.BoxGeometry(1, 1, 1);
    const obsMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const coinGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
    const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    coinGeo.rotateX(Math.PI/2);

    // Spawn logic
    const spawnObj = (z: number) => {
      const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
      const isCoin = Math.random() > 0.6;
      
      if(isCoin) {
        const c = new THREE.Mesh(coinGeo, coinMat);
        c.position.set(lane * 2, 0.5, z);
        scene.add(c);
        coins.push(c);
      } else {
        const o = new THREE.Mesh(obsGeo, obsMat);
        o.position.set(lane * 2, 0.5, z);
        scene.add(o);
        obstacles.push(o);
      }
    };

    // Initial spawn
    for(let i=0; i<20; i++) {
      spawnObj(-10 - (i * 10));
    }

    // CONTROLS
    const handleKey = (e: KeyboardEvent) => {
        if(!stateRef.current.isPlaying || stateRef.current.gameOver) return;
        
        if(e.key === 'ArrowLeft' || e.key === 'a') {
            if(stateRef.current.lane > -1) stateRef.current.lane--;
        }
        if(e.key === 'ArrowRight' || e.key === 'd') {
            if(stateRef.current.lane < 1) stateRef.current.lane++;
        }
        if((e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') && !stateRef.current.jumping) {
            stateRef.current.jumping = true;
            stateRef.current.jumpVel = 0.2;
        }
    };
    window.addEventListener('keydown', handleKey);

    // LOOP
    const animate = () => {
      if(stateRef.current.isPlaying && !stateRef.current.gameOver) {
        stateRef.current.score += 1;
        stateRef.current.speed += 0.0001; // Accel
        setScore(Math.floor(stateRef.current.score / 10));

        // Player physics
        if(stateRef.current.jumping) {
            stateRef.current.y += stateRef.current.jumpVel;
            stateRef.current.jumpVel -= 0.01; // Gravity
            if(stateRef.current.y <= 0) {
                stateRef.current.y = 0;
                stateRef.current.jumping = false;
            }
        }
        
        // Smooth lane switching
        player.position.x += (stateRef.current.lane * 2 - player.position.x) * 0.2;
        player.position.y = 0.5 + stateRef.current.y;

        // Move World
        [...obstacles, ...coins].forEach(obj => {
            obj.position.z += stateRef.current.speed;
        });

        // Collision & Recycle
        for(let i = obstacles.length - 1; i >= 0; i--) {
            const o = obstacles[i];
            if(o.position.z > 5) {
                // Recycle
                o.position.z = -200;
                o.position.x = (Math.floor(Math.random() * 3) - 1) * 2;
            }
            // Check Hit
            if(Math.abs(o.position.z - player.position.z) < 0.8 && 
               Math.abs(o.position.x - player.position.x) < 0.8 &&
               player.position.y < 1.0) {
                   stateRef.current.gameOver = true;
                   setGameOver(true);
                   setIsPlaying(false);
                   audioService.play('fail');
            }
        }

        for(let i = coins.length - 1; i >= 0; i--) {
            const c = coins[i];
            c.rotation.y += 0.1;
            if(c.position.z > 5) {
                c.position.z = -200;
                c.position.x = (Math.floor(Math.random() * 3) - 1) * 2;
            }
            // Check Collect
            if(Math.abs(c.position.z - player.position.z) < 0.8 && 
               Math.abs(c.position.x - player.position.x) < 0.8) {
                   stateRef.current.score += 100; // Bonus
                   c.position.z = -200; // Reset
                   audioService.play('success');
            }
        }
      }

      renderer.render(scene, camera);
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
        window.removeEventListener('keydown', handleKey);
        if(requestRef.current) cancelAnimationFrame(requestRef.current);
        if(mountRef.current && rendererRef.current) {
            mountRef.current.removeChild(rendererRef.current.domElement);
            rendererRef.current.dispose();
        }
    };
  }, []);

  const startGame = () => {
    stateRef.current = {
        lane: 0,
        speed: 0.2,
        score: 0,
        isPlaying: true,
        gameOver: false,
        jumping: false,
        jumpVel: 0,
        y: 0
    };
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  };

  return (
    <div className="relative w-full h-screen bg-sky-300 overflow-hidden">
        <div ref={mountRef} className="w-full h-full" />

        {/* HUD */}
        <div className="absolute top-4 left-4 z-10">
            <button onClick={onExit} className="bg-black/20 p-2 rounded-full backdrop-blur text-white hover:bg-black/40 mb-4 block">
                <ArrowLeft />
            </button>
            <div className="text-3xl font-black italic text-yellow-400 drop-shadow-md font-mono">
                {score}
            </div>
        </div>

        {/* Menu Overlay */}
        {(!isPlaying || gameOver) && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20 backdrop-blur-sm">
                <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full animate-in zoom-in duration-300">
                    <h2 className="text-3xl font-bold mb-2 text-gray-800 font-mono">
                        {gameOver ? "GAME OVER" : "TEMPLE RUNNER"}
                    </h2>
                    {gameOver && <p className="text-gray-500 mb-6">Final Score: {score}</p>}
                    
                    <button 
                        onClick={startGame}
                        className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition flex items-center justify-center gap-2"
                    >
                        {gameOver ? <RotateCcw /> : <Play />}
                        {gameOver ? "TRY AGAIN" : "START RUN"}
                    </button>
                    
                    <div className="mt-6 text-sm text-gray-400">
                        Swipe or Arrow Keys to Move
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
