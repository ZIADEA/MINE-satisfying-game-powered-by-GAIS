import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BaseGameProps } from '../../types';
import { ArrowLeft } from 'lucide-react';

export const Labyrinth: React.FC<BaseGameProps> = ({ onExit }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("Find the Green Pillar");
  
  // Clean up refs for strict mode
  const requestRef = useRef<number | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // SCENE SETUP
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101015);
    scene.fog = new THREE.Fog(0x101015, 2, 15);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // LIGHTS
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    // Player Torch
    const torch = new THREE.PointLight(0xffaa00, 1, 10);
    torch.position.set(0, 0.5, 0);
    scene.add(torch);

    // MAZE GENERATION (Recursive Backtracker)
    const size = 15;
    const maze = Array(size).fill(0).map(() => Array(size).fill(1)); // 1 = wall, 0 = path
    
    const carve = (r: number, c: number) => {
      maze[r][c] = 0;
      const directions = [[0, -2], [0, 2], [-2, 0], [2, 0]].sort(() => Math.random() - 0.5);
      
      for(const [dr, dc] of directions) {
        const nr = r + dr, nc = c + dc;
        if(nr > 0 && nr < size-1 && nc > 0 && nc < size-1 && maze[nr][nc] === 1) {
          maze[r + dr/2][c + dc/2] = 0;
          carve(nr, nc);
        }
      }
    };
    carve(1, 1);

    // BUILD MESHES
    const wallGeo = new THREE.BoxGeometry(1, 2, 1);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x4444ff, roughness: 0.2 });
    const floorGeo = new THREE.PlaneGeometry(size, size);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
    
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(size/2, 0, size/2);
    scene.add(floor);

    const walls: THREE.Mesh[] = [];
    for(let r=0; r<size; r++) {
      for(let c=0; c<size; c++) {
        if(maze[r][c] === 1) {
          const wall = new THREE.Mesh(wallGeo, wallMat);
          wall.position.set(c + 0.5, 1, r + 0.5);
          scene.add(wall);
          walls.push(wall);
        }
      }
    }

    // GOAL
    const goalGeo = new THREE.CylinderGeometry(0.2, 0.2, 2, 16);
    const goalMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const goal = new THREE.Mesh(goalGeo, goalMat);
    let goalPos = { x: size - 1.5, z: size - 1.5 };
    // ensure goal is in open space
    if(maze[size-2][size-2] === 1) goalPos = { x: 1.5, z: 1.5 }; // Fallback
    goal.position.set(goalPos.x, 1, goalPos.z);
    scene.add(goal);

    // CONTROLS VARS
    const player = { x: 1.5, z: 1.5, dir: 0, speed: 0 };
    const keys = { w: false, s: false, a: false, d: false };

    // EVENTS
    const handleKeyDown = (e: KeyboardEvent) => {
       if(e.key === 'w' || e.key === 'ArrowUp') keys.w = true;
       if(e.key === 's' || e.key === 'ArrowDown') keys.s = true;
       if(e.key === 'a' || e.key === 'ArrowLeft') keys.a = true;
       if(e.key === 'd' || e.key === 'ArrowRight') keys.d = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
       if(e.key === 'w' || e.key === 'ArrowUp') keys.w = false;
       if(e.key === 's' || e.key === 'ArrowDown') keys.s = false;
       if(e.key === 'a' || e.key === 'ArrowLeft') keys.a = false;
       if(e.key === 'd' || e.key === 'ArrowRight') keys.d = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // GAME LOOP
    const animate = () => {
      // Movement
      if(keys.a) player.dir += 0.05;
      if(keys.d) player.dir -= 0.05;
      
      const speed = keys.w ? 0.1 : (keys.s ? -0.05 : 0);
      const dx = Math.sin(player.dir + Math.PI) * speed; // +PI to fix orientation
      const dz = Math.cos(player.dir + Math.PI) * speed;

      // Collision Check (Simple box)
      const nextX = player.x + dx;
      const nextZ = player.z + dz;
      
      let collideX = false;
      let collideZ = false;
      
      // Check walls nearby
      const checkRadius = 0.3;
      for(const w of walls) {
        if(Math.abs(w.position.x - nextX) < 0.5 + checkRadius && Math.abs(w.position.z - player.z) < 0.5 + checkRadius) collideX = true;
        if(Math.abs(w.position.x - player.x) < 0.5 + checkRadius && Math.abs(w.position.z - nextZ) < 0.5 + checkRadius) collideZ = true;
      }

      if(!collideX) player.x = nextX;
      if(!collideZ) player.z = nextZ;

      // Camera Update
      camera.position.set(player.x, 1.2, player.z);
      camera.rotation.y = player.dir;
      torch.position.copy(camera.position);

      // Win Condition
      const distToGoal = Math.sqrt(Math.pow(player.x - goal.position.x, 2) + Math.pow(player.z - goal.position.z, 2));
      if(distToGoal < 0.8) {
        setMessage("LEVEL COMPLETED!");
        goal.material.color.setHex(0xffffff);
      }

      renderer.render(scene, camera);
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      if(requestRef.current) cancelAnimationFrame(requestRef.current);
      if(mountRef.current && rendererRef.current) {
         mountRef.current.removeChild(rendererRef.current.domElement);
         rendererRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <div ref={mountRef} className="w-full h-full" />
      
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-4">
        <button onClick={onExit} className="bg-white/10 p-2 rounded-full backdrop-blur text-white hover:bg-white/20">
          <ArrowLeft />
        </button>
        <div className="text-white font-mono bg-black/50 p-2 rounded">
          {message}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-sm font-mono pointer-events-none">
        WASD / ARROWS to Move
      </div>
    </div>
  );
};
