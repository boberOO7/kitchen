import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

export default function ExposeThree({ onReady }) {
  const { gl, scene } = useThree();
  useEffect(() => { onReady?.({ gl, scene }); }, [gl, scene, onReady]);
  return null;
}