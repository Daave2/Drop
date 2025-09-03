"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import { GhostNote } from "@/types";
import { useLocation } from "@/hooks/use-location";
import { latLngToLocal } from "@/lib/geo";

interface ARViewProps {
  notes: GhostNote[];
}

export default function ARView({ notes }: ARViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const noteMeshes = useRef<Record<string, THREE.Object3D>>({});
  const { location } = useLocation();

  // initialize three.js and WebXR renderer
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;

    containerRef.current.appendChild(renderer.domElement);
    const arButton = ARButton.createButton(renderer, { requiredFeatures: ["local"] });
    containerRef.current.appendChild(arButton);

    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      arButton.remove();
      renderer.dispose();
    };
  }, []);

  // create note meshes when notes change
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // remove existing meshes
    Object.values(noteMeshes.current).forEach((mesh) => scene.remove(mesh));
    noteMeshes.current = {};

    notes.forEach((note) => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.font = "24px sans-serif";
        ctx.fillText(note.teaser || "Note", 10, 64);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
      });
      const geometry = new THREE.PlaneGeometry(1, 0.5);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 0, -2); // default; will update with location
      scene.add(mesh);
      noteMeshes.current[note.id] = mesh;
    });
  }, [notes]);

  // update note positions when device location changes
  useEffect(() => {
    if (!location) return;
    notes.forEach((note) => {
      const mesh = noteMeshes.current[note.id];
      if (mesh) {
        const pos = latLngToLocal(
          { lat: location.latitude, lng: location.longitude },
          { lat: note.lat, lng: note.lng },
        );
        mesh.position.copy(pos);
      }
    });
  }, [location, notes]);

  return <div ref={containerRef} className="absolute inset-0" />;
}

