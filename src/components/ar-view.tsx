"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import { GhostNote } from "@/types";
import { useLocation, Coordinates } from "@/hooks/use-location";
import { latLngToLocal, localToLatLng } from "@/lib/geo";
import { distanceBetween } from "geofire-common";

interface ARViewProps {
  notes: GhostNote[];
  onSelectNote: (note: GhostNote) => void;
  onReturnToMap: () => void;
  onCreateNote: (coords: Coordinates) => void;
}

export default function ARView({ notes, onSelectNote, onReturnToMap, onCreateNote }: ARViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const noteMeshes = useRef<Record<string, THREE.Group>>({});
  const badgeTextures = useRef<Record<string, THREE.CanvasTexture>>({});
  const hitTestSourceRef = useRef<any>(null);
  const localSpaceRef = useRef<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const isCreatingRef = useRef(false);
  const { location } = useLocation();
  const locationRef = useRef(location);
  const onCreateNoteRef = useRef(onCreateNote);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    onCreateNoteRef.current = onCreateNote;
  }, [onCreateNote]);

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
    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["local", "hit-test"],
    });
    containerRef.current.appendChild(arButton);

    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    const controller = renderer.xr.getController(0);
    scene.add(controller);

    renderer.xr.addEventListener("sessionstart", async () => {
      const session = renderer.xr.getSession();
      if (!session) return;
      localSpaceRef.current = renderer.xr.getReferenceSpace();
      const viewerSpace = await (session as any).requestReferenceSpace("viewer");
      hitTestSourceRef.current = await (session as any).requestHitTestSource({ space: viewerSpace });
    });

    renderer.xr.addEventListener("sessionend", () => {
      hitTestSourceRef.current?.cancel?.();
      hitTestSourceRef.current = null;
      localSpaceRef.current = null;
    });

    const raycaster = new THREE.Raycaster();
    const tempMatrix = new THREE.Matrix4();
    const onSelect = (event: any) => {
      if (isCreatingRef.current && hitTestSourceRef.current && localSpaceRef.current && locationRef.current) {
        const results = event.frame.getHitTestResults(hitTestSourceRef.current);
        if (results.length > 0) {
          const pose = results[0].getPose(localSpaceRef.current);
          if (pose) {
            const { x, z } = pose.transform.position;
            const latLng = localToLatLng(
              { lat: locationRef.current.latitude, lng: locationRef.current.longitude },
              new THREE.Vector3(x, 0, z),
            );
            onCreateNoteRef.current({
              latitude: latLng.lat,
              longitude: latLng.lng,
              accuracy: locationRef.current.accuracy,
            });
            isCreatingRef.current = false;
            setIsCreating(false);
          }
        }
        return;
      }

      tempMatrix.identity().extractRotation(controller.matrixWorld);
      raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
      const intersects = raycaster.intersectObjects(
        Object.values(noteMeshes.current),
        true,
      );
      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && !obj.userData.note) {
          obj = obj.parent;
        }
        const note = obj?.userData.note as GhostNote | undefined;
        if (note) {
          onSelectNote(note);
        }
      }
    };
    controller.addEventListener("select", onSelect);

    return () => {
      renderer.setAnimationLoop(null);
      controller.removeEventListener("select", onSelect);
      scene.remove(controller);
      arButton.remove();
      renderer.dispose();
    };
  }, [onSelectNote]);

  // create note meshes when notes change
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // remove existing meshes
    Object.values(noteMeshes.current).forEach((mesh) => scene.remove(mesh));
    noteMeshes.current = {};
    badgeTextures.current = {};

    notes.forEach((note) => {
      const group = new THREE.Group();
      group.userData.note = note;

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
      group.add(mesh);

      const badgeCanvas = document.createElement("canvas");
      badgeCanvas.width = 128;
      badgeCanvas.height = 64;
      const badgeCtx = badgeCanvas.getContext("2d");
      if (badgeCtx) {
        badgeCtx.fillStyle = "rgba(0,0,0,0.6)";
        badgeCtx.fillRect(0, 0, badgeCanvas.width, badgeCanvas.height);
        badgeCtx.fillStyle = "white";
        badgeCtx.font = "24px sans-serif";
        badgeCtx.fillText("0m", 10, 40);
      }
      const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
      const badgeMaterial = new THREE.MeshBasicMaterial({
        map: badgeTexture,
        transparent: true,
      });
      const badgeGeometry = new THREE.PlaneGeometry(0.5, 0.25);
      const badgeMesh = new THREE.Mesh(badgeGeometry, badgeMaterial);
      badgeMesh.name = "badge";
      badgeMesh.position.set(0, -0.5, 0);
      group.add(badgeMesh);
      badgeTextures.current[note.id] = badgeTexture;

      group.position.set(0, 0, -2); // default; will update with location
      scene.add(group);
      noteMeshes.current[note.id] = group;
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
        const distance =
          distanceBetween(
            [location.latitude, location.longitude],
            [note.lat, note.lng],
          ) * 1000;
        const bearing = getBearing(
          { latitude: location.latitude, longitude: location.longitude },
          { latitude: note.lat, longitude: note.lng },
        );
        mesh.rotation.y = THREE.MathUtils.degToRad(bearing);
        const tex = badgeTextures.current[note.id];
        const canvas = tex.image as HTMLCanvasElement;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "white";
          ctx.font = "24px sans-serif";
          ctx.fillText(`${Math.round(distance)}m`, 10, 40);
        }
        tex.needsUpdate = true;
      }
    });
  }, [location, notes]);

  const handleReturn = () => {
    rendererRef.current?.xr.getSession()?.end();
    onReturnToMap();
  };

  return (
    <div ref={containerRef} className="absolute inset-0">
      <button
        onClick={handleReturn}
        className="absolute top-4 left-4 z-10 bg-background/80 text-foreground px-3 py-1 rounded-md"
      >
        Return to Map
      </button>
      <ARCreateButton
        isCreating={isCreating}
        onToggle={() => {
          const next = !isCreatingRef.current;
          isCreatingRef.current = next;
          setIsCreating(next);
        }}
      />
    </div>
  );
}

function ARCreateButton({
  isCreating,
  onToggle,
}: {
  isCreating: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-background/80 text-foreground px-3 py-1 rounded-md"
    >
      {isCreating ? "Cancel" : "Create Note"}
    </button>
  );
}

function getBearing(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}


