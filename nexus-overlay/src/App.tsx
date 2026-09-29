import React, { useEffect } from 'react';
import { NexusCanvas } from './components/3d/NexusCanvas';
import { voiceEngine } from './services/voiceEngine';

export default function App() {
  useEffect(() => {
    voiceEngine.init();
  }, []);

  return <main className="w-screen h-screen overflow-hidden bg-[#050711] select-none"><NexusCanvas /></main>;
}
